"""Evaluate template rendering quality at scale.

For each doc_type, sample N docs from normalized data,
render with template, and check for common issues.
"""

import json
import sys
from pathlib import Path
from collections import Counter, defaultdict

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "backend"))
from app.core.templates import render_document
from app.models.schemas import DocType, GenerateRequest, IntentResult

DOC_TYPE_MAP = {
    "函": DocType.LETTER,
    "書函": DocType.INFORMAL_LETTER,
    "簽": DocType.MEMO,
    "便簽": DocType.NOTE,
    "公告": DocType.ANNOUNCEMENT,
    "令": DocType.DECREE,
    "開會通知單": DocType.MEETING_NOTICE,
}

ACTION_MAP = {
    "函": "新案",
    "書函": "新案",
    "簽": "報告",
    "便簽": "報告",
    "公告": "公布法令",
    "令": "公布法令",
    "開會通知單": "會議通知",
}

GAZETTE = Path(__file__).parent.parent / "gazette" / "gazette_normalized_nchc.jsonl"
NCHC = Path(__file__).parent.parent / "datasets_from_NCHC" / "od_normalized.jsonl"


def load_samples(n_per_type=50):
    """Load N samples per doc_type from both datasets."""
    by_type = defaultdict(list)

    for fpath, source in [(GAZETTE, "gazette"), (NCHC, "nchc")]:
        if not fpath.exists():
            continue
        with open(fpath) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    d = json.loads(line)
                    if "error" in d:
                        continue
                    dt = d.get("doc_type", d.get("type", ""))
                    if dt and dt in DOC_TYPE_MAP:
                        d["_source"] = source
                        by_type[dt].append(d)
                except:
                    pass

    samples = {}
    for dt, docs in by_type.items():
        samples[dt] = docs[:n_per_type]
    return samples


def build_request(d: dict) -> tuple:
    """Build GenerateRequest from normalized doc."""
    dt = d.get("doc_type", d.get("type", ""))
    subtype = d.get("subtype", "")
    items = d.get("items") or d.get("explanation_items") or []
    if not isinstance(items, list):
        items = []
    items = [str(i) for i in items if isinstance(i, str)]
    action = d.get("action_items") or []
    if not isinstance(action, list):
        action = []
    action = [str(i) for i in action if isinstance(i, str)]

    req = GenerateRequest(
        intent=IntentResult(
            sender=str(d.get("organ", "") or ""),
            receiver=str(d.get("receiver", "") or ""),
            doc_type=dt,
            action_type=ACTION_MAP.get(dt, "新案"),
            subtype=subtype,
        ),
        subject_detail=str(d.get("subject", "") or ""),
        explanation_items=items,
        action_items=action,
        recipients_main=[],
        recipients_cc=[],
        doc_date="",
        doc_number=str(d.get("doc_number", "") or ""),
        speed="普通件",
        attachments_text="",
    )
    return DOC_TYPE_MAP[dt], req


def check_rendered(dt_str: str, d: dict, rendered: str) -> list:
    """Check rendered output for issues. Returns list of issue strings."""
    issues = []

    # Check subject is present
    subject = str(d.get("subject", "") or "")
    if subject and len(subject) > 5:
        # Check at least part of subject appears
        check = subject[:20]
        if check not in rendered:
            issues.append(f"subject_missing: '{check}' not in output")

    # Check for duplicated verbs
    for verb in ["修正修正", "訂定訂定", "廢止廢止"]:
        if verb in rendered:
            issues.append(f"duplicated_verb: {verb}")

    # Check for doubled expectation
    for phrase in ["請查照。，請查照", "請鑒核。，請鑒核", "請照辦。，請照辦"]:
        if phrase in rendered:
            issues.append(f"doubled_expectation: {phrase[:15]}")

    # Check organ is present (if available)
    organ = str(d.get("organ", "") or "")
    if organ and len(organ) > 1 and organ not in rendered:
        issues.append(f"organ_missing: {organ}")

    # Check signer (令/公告 should have signer)
    signer = str(d.get("signer", "") or "")
    if signer and dt_str in ("令", "公告") and signer not in rendered:
        issues.append(f"signer_missing: {signer}")

    # Check items rendered (at least first item should appear)
    items = d.get("items") or d.get("explanation_items") or []
    if isinstance(items, list) and items:
        first = str(items[0]) if isinstance(items[0], str) else ""
        if first and len(first) > 10 and first[:15] not in rendered:
            issues.append(f"first_item_missing")

    # Check empty output
    if len(rendered.strip()) < 20:
        issues.append("output_too_short")

    return issues


def run(n_per_type=50):
    samples = load_samples(n_per_type)
    print(f"Loaded samples: {', '.join(f'{k}:{len(v)}' for k, v in samples.items())}\n")

    total = 0
    total_ok = 0
    total_err = 0
    issue_counts = Counter()
    by_type_stats = {}

    for dt_str, docs in sorted(samples.items()):
        ok = 0
        err = 0
        render_fail = 0
        type_issues = Counter()

        for d in docs:
            total += 1
            try:
                doc_type, req = build_request(d)
                rendered = render_document(doc_type, {}, req)
                issues = check_rendered(dt_str, d, rendered)
                if issues:
                    err += 1
                    for iss in issues:
                        type_issues[iss.split(":")[0]] += 1
                        issue_counts[iss.split(":")[0]] += 1
                else:
                    ok += 1
            except Exception as e:
                render_fail += 1
                issue_counts["render_exception"] += 1

        total_ok += ok
        total_err += err
        pct = ok / len(docs) * 100 if docs else 0
        by_type_stats[dt_str] = {"ok": ok, "err": err, "fail": render_fail, "total": len(docs)}
        status = "✅" if pct >= 90 else "⚠️" if pct >= 70 else "❌"
        print(f"{status} {dt_str}: {ok}/{len(docs)} OK ({pct:.0f}%)", end="")
        if type_issues:
            top = ", ".join(f"{k}:{v}" for k, v in type_issues.most_common(3))
            print(f"  issues: {top}", end="")
        if render_fail:
            print(f"  render_fail: {render_fail}", end="")
        print()

    print(f"\n{'='*50}")
    print(f"Total: {total_ok}/{total} OK ({total_ok/total*100:.1f}%)")
    print(f"\nTop issues:")
    for iss, cnt in issue_counts.most_common(10):
        print(f"  {iss}: {cnt}")

    # Save results
    result = {
        "total": total,
        "ok": total_ok,
        "error": total_err,
        "ok_rate": round(total_ok / total, 3) if total else 0,
        "by_type": by_type_stats,
        "top_issues": dict(issue_counts.most_common(10)),
    }
    with open(Path(__file__).parent / "template_eval_results.json", "w") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    run(n)
