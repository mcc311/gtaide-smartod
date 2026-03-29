"""E2E V2 Benchmark: simulate user answering clarify questions, compare final output.

Flow per case:
1. parse-intent (user query)
2. clarify (get questions)
3. LLM simulates user answering questions (based on gold standard)
4. generate-with-answers
5. Compare generated content vs gold standard
"""

import json
import asyncio
import time
import sys
from pathlib import Path
from openai import AsyncOpenAI
import aiohttp

SMARTOD_URL = "http://localhost:8000"

# LLM for simulating user answers + judging
JUDGE_API_KEY = "sk-iF34xnGRrQhzzvHFKLE61w"
JUDGE_BASE_URL = "https://portal.genai.nchc.org.tw/api/v1"
JUDGE_MODEL = "gpt-oss-120b"

judge_client = AsyncOpenAI(api_key=JUDGE_API_KEY, base_url=JUDGE_BASE_URL)

BENCHMARK_DIR = Path(__file__).parent
GOLD_FILE = BENCHMARK_DIR / "gold_standard.jsonl"
QUERY_FILE = BENCHMARK_DIR / "user_queries.jsonl"
RESULT_FILE = BENCHMARK_DIR / "e2e_v2_results.jsonl"
SUMMARY_FILE = BENCHMARK_DIR / "e2e_v2_summary.json"

SEMAPHORE = asyncio.Semaphore(3)  # Lower concurrency — each case is multi-step


async def api_call(endpoint: str, payload: dict, timeout: int = 120) -> dict:
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{SMARTOD_URL}/api/{endpoint}",
            json=payload,
            timeout=aiohttp.ClientTimeout(total=timeout),
        ) as resp:
            return await resp.json()


async def simulate_user_answers(questions: list[dict], gold: dict) -> dict:
    """Use LLM to simulate a user answering clarify questions based on gold standard."""
    if not questions:
        return {}

    prompt = f"""你是公文系統的使用者。根據以下真實公文資訊，回答系統的提問。
每題選最接近的選項，或用自訂文字回答。回傳 JSON：{{"field_key": "answer", ...}}

真實公文資訊：
- 類型：{gold.get('doc_type', gold.get('type', ''))}/{gold.get('subtype', '')}
- 機關：{gold.get('organ', '')}
- 主旨：{gold.get('subject', '')}
- 依據：{gold.get('basis', '')}
- 說明：{json.dumps(gold.get('items', [])[:3], ensure_ascii=False)}
- 署名：{gold.get('signer', '')}

系統提問：
"""
    for q in questions:
        options = q.get("options", [])
        opts_text = " | ".join(f"{o['label']}" for o in options)
        prompt += f"- {q['header']}（{q['question']}）選項：{opts_text}\n"

    prompt += "\n回傳純 JSON，每個 field_key 對應一個答案（選項 label 或自訂文字）。"

    async with SEMAPHORE:
        try:
            resp = await judge_client.chat.completions.create(
                model=JUDGE_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500,
            )
            content = resp.choices[0].message.content
            if not content:
                return {}
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(content[start:end])
        except Exception as e:
            print(f"    simulate error: {str(e)[:60]}", flush=True)
    return {}


async def judge_content(gold: dict, generated: dict) -> dict:
    """LLM judge: compare generated content vs gold standard."""
    prompt = f"""比較「系統生成的公文內容」與「標準答案」，評分 1-5。

標準答案：
- 主旨：{gold.get('subject', '')}
- 說明項目：{json.dumps(gold.get('items', [])[:3], ensure_ascii=False)}
- 依據：{gold.get('basis', '')}

系統生成：
- 主旨：{generated.get('subject_detail', '')}
- 說明：{json.dumps(generated.get('explanation_items', []), ensure_ascii=False)}
- 辦法：{json.dumps(generated.get('action_items', []), ensure_ascii=False)}

評分維度：
1. subject_match: 主旨是否準確反映原文 (1-5)
2. content_coverage: 說明/辦法是否涵蓋標準答案的重點 (1-5)
3. formality: 用語是否正式得體 (1-5)
4. overall: 整體品質 (1-5)

回傳 JSON：{{"subject_match":N,"content_coverage":N,"formality":N,"overall":N,"comment":"..."}}"""

    async with SEMAPHORE:
        try:
            resp = await judge_client.chat.completions.create(
                model=JUDGE_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=500,
            )
            content = resp.choices[0].message.content
            if not content:
                return {"error": "empty"}
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(content[start:end])
        except Exception as e:
            return {"error": str(e)[:60]}
    return {"error": "unknown"}


async def run_one(idx: int, query: dict, gold: dict) -> dict:
    user_query = query["user_query"]
    result = {"idx": idx, "user_query": user_query[:50]}

    try:
        # Step 1: Parse intent
        intent = await api_call("parse-intent", {"user_input": user_query})
        if "error" in intent and intent["error"]:
            result["error"] = f"parse-intent: {intent['error']}"
            return result
        result["sys_type"] = intent.get("doc_type", "")
        result["sys_subtype"] = intent.get("subtype", "")
        result["sys_confident"] = intent.get("confident")

        # Get phrases
        phrases_resp = await api_call("get-phrases", {
            "sender": intent.get("sender", ""),
            "receiver": intent.get("receiver", ""),
            "action_type": intent.get("action_type", ""),
            "receiver_type": intent.get("receiver_type", "政府機關"),
            "sender_level": intent.get("sender_level", 0),
            "receiver_level": intent.get("receiver_level", 0),
            "sender_parent": intent.get("sender_parent", ""),
            "receiver_parent": intent.get("receiver_parent", ""),
            "subtype": intent.get("subtype", ""),
        })
        direction = phrases_resp.get("direction", "平行文")
        phrases = phrases_resp.get("phrases", {})

        # Step 2: Clarify
        clarify_resp = await api_call("clarify", {
            "intent": intent,
            "phrases": phrases,
            "doc_type": intent.get("doc_type", "函"),
            "direction": direction,
            "subtype": intent.get("subtype", ""),
        })

        questions = clarify_resp.get("questions", [])
        result["num_questions"] = len(questions)

        # Step 3: Simulate user answers
        if questions:
            answers = await simulate_user_answers(questions, gold)
            result["simulated_answers"] = len(answers)
        else:
            answers = {}
            result["simulated_answers"] = 0

        # Step 4: Generate with answers
        gen_resp = await api_call("generate-with-answers", {
            "intent": intent,
            "phrases": phrases,
            "doc_type": intent.get("doc_type", "函"),
            "direction": direction,
            "subtype": intent.get("subtype", ""),
            "answers": answers,
            "previous_questions": [
                {"field_key": q["field_key"], "header": q["header"]}
                for q in questions
            ],
        }, timeout=180)

        result["subject_detail"] = gen_resp.get("subject_detail", "")
        result["explanation_count"] = len(gen_resp.get("explanation_items", []))
        result["action_count"] = len(gen_resp.get("action_items", []))
        result["citations"] = gen_resp.get("citations", [])

        # Step 5: Judge
        judge = await judge_content(gold, gen_resp)
        result["judge"] = judge

        status = "OK" if "error" not in judge else "JUDGE_ERR"
        print(f"  [{idx}] {status} type={result['sys_type']}/{result['sys_subtype']} "
              f"q={result['num_questions']} subj={result['subject_detail'][:30]}", flush=True)

    except Exception as e:
        result["error"] = str(e)[:100]
        print(f"  [{idx}] ERROR: {str(e)[:60]}", flush=True)

    return result


async def main():
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

    print(f"E2E V2 Benchmark: {len(queries)} cases\n", flush=True)
    start = time.time()

    tasks = [run_one(i, q, g) for i, (q, g) in enumerate(zip(queries, golds))]
    results = await asyncio.gather(*tasks)
    elapsed = time.time() - start

    # Save
    with open(RESULT_FILE, "w") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # Summary
    valid = [r for r in results if "error" not in r and "judge" in r and "error" not in r.get("judge", {})]
    errors = [r for r in results if "error" in r]

    avg_scores = {}
    for key in ["subject_match", "content_coverage", "formality", "overall"]:
        scores = [r["judge"][key] for r in valid if key in r.get("judge", {})]
        avg_scores[key] = round(sum(scores) / len(scores), 2) if scores else 0

    type_acc = sum(1 for r in results if r.get("sys_type") == queries[r["idx"]]["doc_type"]) / len(results) if results else 0

    summary = {
        "total": len(queries),
        "valid": len(valid),
        "errors": len(errors),
        "elapsed_sec": round(elapsed, 1),
        "type_accuracy": round(type_acc, 3),
        "judge_avg": avg_scores,
        "avg_questions": round(sum(r.get("num_questions", 0) for r in results) / len(results), 1),
        "avg_citations": round(sum(len(r.get("citations", [])) for r in results) / len(results), 1),
    }

    with open(SUMMARY_FILE, "w") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"E2E V2 Results ({len(queries)} cases, {elapsed:.0f}s)")
    print(f"{'='*50}")
    print(f"Valid: {len(valid)}, Errors: {len(errors)}")
    print(f"Type accuracy: {type_acc:.1%}")
    print(f"Avg questions asked: {summary['avg_questions']}")
    print(f"Avg citations found: {summary['avg_citations']}")
    print(f"\nJudge scores (1-5):")
    for k, v in avg_scores.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    asyncio.run(main())
