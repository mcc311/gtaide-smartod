"""Evaluate RAG search quality using real document subjects as queries."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "backend"))
from app.core.rag import load_index, retrieve

TEST_FILE = Path(__file__).parent / "rag_test.jsonl"
RESULT_FILE = Path(__file__).parent / "rag_results.jsonl"


def run():
    load_index()

    tests = []
    with open(TEST_FILE) as f:
        for line in f:
            if line.strip():
                tests.append(json.loads(line))

    print(f"Testing {len(tests)} RAG queries\n")

    results = []
    metrics = {
        "type_p1": 0, "type_p3": 0,
        "subtype_p1": 0, "subtype_p3": 0,
        "no_filter_type_p1": 0, "no_filter_type_p3": 0,
    }
    total = 0

    for i, t in enumerate(tests):
        query = t["query"]
        expected_type = t["expected_type"]
        expected_subtype = t["expected_subtype"]
        r = {"idx": i, "query": query[:60], "expected": f"{expected_type}/{expected_subtype}"}

        # Test 1: retrieve with type+subtype filter
        docs_filtered = retrieve(query, doc_type=expected_type, subtype=expected_subtype, top_k=3)
        r["filtered_count"] = len(docs_filtered)
        if docs_filtered:
            r["filtered_top1_type"] = docs_filtered[0].get("type", "")
            r["filtered_top1_subtype"] = docs_filtered[0].get("subtype", "")
            r["filtered_top1_subject"] = docs_filtered[0].get("subject", docs_filtered[0].get("text", "")[:50])[:50]

        # Test 2: retrieve with type filter only
        docs_type = retrieve(query, doc_type=expected_type, top_k=3)
        if docs_type:
            # Check if any top-3 has matching subtype
            subtypes_found = [d.get("subtype", "") for d in docs_type]
            r["type_filter_subtypes"] = subtypes_found
            if expected_subtype in subtypes_found:
                metrics["type_p3"] += 1
            if docs_type[0].get("subtype", "") == expected_subtype:
                metrics["type_p1"] += 1

        # Test 3: retrieve without any filter
        docs_no_filter = retrieve(query, top_k=3)
        if docs_no_filter:
            types_found = [d.get("type", "") for d in docs_no_filter]
            if expected_type in types_found:
                metrics["no_filter_type_p3"] += 1
            if docs_no_filter[0].get("type", "") == expected_type:
                metrics["no_filter_type_p1"] += 1

        results.append(r)
        total += 1

        if (i + 1) % 50 == 0:
            print(f"  [{i+1}/{len(tests)}]...", flush=True)

    # Save
    with open(RESULT_FILE, "w") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # Summary
    print(f"\n{'='*50}")
    print(f"RAG Eval ({total} queries)")
    print(f"{'='*50}")
    print(f"\nWith type+subtype filter:")
    has_results = sum(1 for r in results if r["filtered_count"] > 0)
    print(f"  Queries with results: {has_results}/{total} ({100*has_results//total}%)")

    print(f"\nWith type filter only:")
    print(f"  Subtype P@1: {metrics['type_p1']}/{total} ({100*metrics['type_p1']//total}%)")
    print(f"  Subtype P@3: {metrics['type_p3']}/{total} ({100*metrics['type_p3']//total}%)")

    print(f"\nNo filter:")
    print(f"  Type P@1: {metrics['no_filter_type_p1']}/{total} ({100*metrics['no_filter_type_p1']//total}%)")
    print(f"  Type P@3: {metrics['no_filter_type_p3']}/{total} ({100*metrics['no_filter_type_p3']//total}%)")

    # Breakdown by subtype
    from collections import Counter, defaultdict
    by_subtype = defaultdict(lambda: {"total": 0, "has_results": 0})
    for r in results:
        key = r["expected"]
        by_subtype[key]["total"] += 1
        if r["filtered_count"] > 0:
            by_subtype[key]["has_results"] += 1

    print(f"\nPer-subtype coverage (with filter):")
    for key in sorted(by_subtype.keys()):
        s = by_subtype[key]
        pct = 100 * s["has_results"] // s["total"] if s["total"] > 0 else 0
        print(f"  {key}: {s['has_results']}/{s['total']} ({pct}%)")


if __name__ == "__main__":
    run()
