"""SmartOD Benchmark: evaluate end-to-end document generation quality."""

import json
import asyncio
import time
import sys
from pathlib import Path
from openai import AsyncOpenAI

# SmartOD API
SMARTOD_URL = "http://localhost:8000"

# LLM Judge (NCHC Portal API)
JUDGE_API_KEY = "sk-iF34xnGRrQhzzvHFKLE61w"
JUDGE_BASE_URL = "https://portal.genai.nchc.org.tw/api/v1"
JUDGE_MODEL = "gpt-oss-120b"

judge_client = AsyncOpenAI(api_key=JUDGE_API_KEY, base_url=JUDGE_BASE_URL)

BENCHMARK_DIR = Path(__file__).parent
GOLD_FILE = BENCHMARK_DIR / "gold_standard.jsonl"
QUERY_FILE = BENCHMARK_DIR / "user_queries.jsonl"
RESULT_FILE = BENCHMARK_DIR / "benchmark_results.jsonl"
SUMMARY_FILE = BENCHMARK_DIR / "benchmark_summary.json"

SEMAPHORE = asyncio.Semaphore(5)


# ── Step 1: Call SmartOD parse-intent ──

async def call_parse_intent(user_query: str) -> dict:
    """Call SmartOD /api/parse-intent."""
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{SMARTOD_URL}/api/parse-intent",
            json={"user_input": user_query},
            timeout=aiohttp.ClientTimeout(total=60),
        ) as resp:
            return await resp.json()


# ── Step 2: Format compliance checks (rule-based) ──

def check_format_compliance(gold: dict, intent: dict) -> dict:
    """Rule-based format checks based on 文書處理手冊."""
    checks = {}
    doc_type = gold.get("doc_type", gold.get("type", ""))

    # Check 1: 令 subject should start with verb (訂定/修正/廢止)
    if doc_type == "令":
        subject = gold.get("subject", "")
        checks["令_verb_first"] = any(subject.startswith(v) for v in ["訂定", "修正", "廢止", "核定", "公告", "允許", "補充"])

    # Check 2: 公告 should have basis
    if doc_type == "公告":
        subtype = gold.get("subtype", "")
        if subtype in ("預告修法",):
            checks["公告_has_basis"] = bool(gold.get("basis"))

    # Check 3: Date format = 中華民國
    date = gold.get("date", "")
    checks["date_roc_format"] = date.startswith("中華民國")

    # Check 4: Signer has title + name
    signer = gold.get("signer", "")
    checks["signer_has_title"] = " " in signer and len(signer) > 3

    # Check 5: Items don't have numbering
    items = gold.get("items", [])
    if items:
        first = items[0] if isinstance(items[0], str) else ""
        checks["items_no_numbering"] = not (first and len(first) > 1 and first[1] == "、" and first[0] in "一二三四五六七八九十")

    return checks


# ── Step 3: LLM Judge ──

JUDGE_PROMPT = """你是公文品質評審。比較「系統產出的意圖分析」與「標準答案」，給出評分。

標準答案（真實公文）：
- 類型：{gold_type}/{gold_subtype}
- 機關：{gold_organ}
- 主旨：{gold_subject}

系統分析結果：
- 類型：{sys_type}
- 子類型：{sys_subtype}
- 機關：{sys_sender}
- 主旨摘要：{sys_subject}

請評分（每項 1-5 分）並簡短說明：
1. type_match: 公文類型判斷是否正確（5=完全正確，1=完全錯誤）
2. subtype_match: 子類型判斷是否正確（5=完全正確，3=接近，1=完全錯誤）
3. organ_match: 機關識別是否正確（5=完全正確，3=簡稱對應正確，1=完全錯誤）
4. subject_quality: 主旨摘要是否準確反映原文意圖（5=精準，3=大致正確，1=偏離）

回傳 JSON：{{"type_match":N,"subtype_match":N,"organ_match":N,"subject_quality":N,"comment":"簡短說明"}}"""


async def judge_intent(gold: dict, intent: dict) -> dict:
    """Use LLM to judge intent parsing quality."""
    async with SEMAPHORE:
        try:
            prompt = JUDGE_PROMPT.format(
                gold_type=gold.get("doc_type", gold.get("type", "")),
                gold_subtype=gold.get("subtype", ""),
                gold_organ=gold.get("organ", ""),
                gold_subject=gold.get("subject", ""),
                sys_type=intent.get("doc_type", ""),
                sys_subtype=intent.get("subtype", ""),
                sys_sender=intent.get("sender", ""),
                sys_subject=intent.get("subject_brief", ""),
            )
            resp = await judge_client.chat.completions.create(
                model=JUDGE_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500,
            )
            content = resp.choices[0].message.content
            if not content:
                return {"error": "empty judge response"}
            # Parse JSON from response
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(content[start:end])
            return {"error": f"cannot parse: {content[:100]}"}
        except Exception as e:
            return {"error": str(e)[:100]}


# ── Step 4: Run one benchmark case ──

async def run_one(idx: int, query: dict, gold: dict) -> dict:
    """Run one benchmark case: query → parse-intent → judge."""
    user_query = query["user_query"]
    expected_type = query["doc_type"]
    expected_subtype = query["subtype"]

    result = {
        "idx": idx,
        "user_query": user_query,
        "expected_type": expected_type,
        "expected_subtype": expected_subtype,
        "gold_organ": gold.get("organ", ""),
        "gold_subject": gold.get("subject", "")[:60],
    }

    # Step 1: Parse intent
    try:
        intent = await call_parse_intent(user_query)
        if "error" in intent:
            result["error"] = intent["error"]
            return result
        result["sys_type"] = intent.get("doc_type", "")
        result["sys_subtype"] = intent.get("subtype", "")
        result["sys_sender"] = intent.get("sender", "")
        result["sys_subject"] = intent.get("subject_brief", "")
        result["sys_confident"] = intent.get("confident", None)
        result["sys_reasoning"] = intent.get("reasoning", "")
    except Exception as e:
        result["error"] = str(e)[:100]
        return result

    # Step 2: Exact match scores
    result["type_exact"] = 1 if result["sys_type"] == expected_type else 0
    result["subtype_exact"] = 1 if result["sys_subtype"] == expected_subtype else 0

    # Step 3: Format compliance
    result["format_checks"] = check_format_compliance(gold, intent)

    # Step 4: LLM Judge
    judge_scores = await judge_intent(gold, intent)
    result["judge"] = judge_scores

    status = "✅" if result["type_exact"] and result["subtype_exact"] else "⚠️"
    print(f"  [{idx}] {status} {expected_type}/{expected_subtype} → {result['sys_type']}/{result['sys_subtype']}  |  {user_query[:40]}", flush=True)

    return result


# ── Main ──

async def main():
    # Load data
    golds = []
    with open(GOLD_FILE) as f:
        for line in f:
            if line.strip():
                golds.append(json.loads(line))

    queries = []
    with open(QUERY_FILE) as f:
        for line in f:
            if line.strip():
                queries.append(json.loads(line))

    n = int(sys.argv[1]) if len(sys.argv) > 1 else len(queries)
    queries = queries[:n]
    golds = golds[:n]

    print(f"Running benchmark: {len(queries)} cases\n", flush=True)
    start = time.time()

    # Run all
    tasks = [run_one(i, q, g) for i, (q, g) in enumerate(zip(queries, golds))]
    results = await asyncio.gather(*tasks)
    elapsed = time.time() - start

    # Save results
    with open(RESULT_FILE, "w") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # Compute summary
    valid = [r for r in results if "error" not in r]
    errors = [r for r in results if "error" in r]

    type_acc = sum(r["type_exact"] for r in valid) / len(valid) if valid else 0
    subtype_acc = sum(r["subtype_exact"] for r in valid) / len(valid) if valid else 0

    judge_valid = [r for r in valid if "judge" in r and "error" not in r.get("judge", {})]
    avg_scores = {}
    for key in ["type_match", "subtype_match", "organ_match", "subject_quality"]:
        scores = [r["judge"][key] for r in judge_valid if key in r.get("judge", {})]
        avg_scores[key] = round(sum(scores) / len(scores), 2) if scores else 0

    # Format compliance
    all_checks = {}
    for r in valid:
        for k, v in r.get("format_checks", {}).items():
            if k not in all_checks:
                all_checks[k] = {"pass": 0, "total": 0}
            all_checks[k]["total"] += 1
            if v:
                all_checks[k]["pass"] += 1
    format_summary = {k: f"{v['pass']}/{v['total']}" for k, v in all_checks.items()}

    summary = {
        "total": len(queries),
        "valid": len(valid),
        "errors": len(errors),
        "elapsed_sec": round(elapsed, 1),
        "type_accuracy": round(type_acc, 3),
        "subtype_accuracy": round(subtype_acc, 3),
        "judge_avg_scores": avg_scores,
        "format_compliance": format_summary,
    }

    with open(SUMMARY_FILE, "w") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    # Print summary
    print(f"\n{'='*50}")
    print(f"Benchmark Results ({len(queries)} cases, {elapsed:.1f}s)")
    print(f"{'='*50}")
    print(f"Type accuracy (exact):    {type_acc:.1%}")
    print(f"Subtype accuracy (exact): {subtype_acc:.1%}")
    print(f"Errors:                   {len(errors)}")
    print(f"\nLLM Judge (1-5):")
    for k, v in avg_scores.items():
        print(f"  {k}: {v}")
    print(f"\nFormat compliance:")
    for k, v in format_summary.items():
        print(f"  {k}: {v}")

    # Show mismatches
    mismatches = [r for r in valid if not r["type_exact"] or not r["subtype_exact"]]
    if mismatches:
        print(f"\nMismatches ({len(mismatches)}):")
        for r in mismatches[:10]:
            print(f"  [{r['idx']}] expected {r['expected_type']}/{r['expected_subtype']} → got {r['sys_type']}/{r['sys_subtype']}")
            print(f"       query: {r['user_query'][:50]}")


if __name__ == "__main__":
    asyncio.run(main())
