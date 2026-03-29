"""Evaluate law search tools using real citations from gazette data."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "backend"))
from app.core.law_search import search_law, get_article, verify_citation, load_laws

TEST_FILE = Path(__file__).parent / "law_search_test.jsonl"
RESULT_FILE = Path(__file__).parent / "law_search_results.jsonl"


def run():
    load_laws()

    tests = []
    with open(TEST_FILE) as f:
        for line in f:
            if line.strip():
                tests.append(json.loads(line))

    print(f"Testing {len(tests)} law citations\n")

    results = []
    search_ok = 0
    article_ok = 0
    verify_ok = 0
    search_fail = []
    article_fail = []
    verify_fail = []

    for i, t in enumerate(tests):
        citation = t["citation"]
        law_name = t["law_name"]
        article_no = t["article_no"]
        r = {"citation": citation, "law_name": law_name, "article_no": article_no}

        # Test 1: search_law — can we find this law?
        search_results = search_law(law_name, top_k=5)
        found_names = [s["name"] for s in search_results]
        # Check if any result contains the law name
        search_hit = any(law_name in name or name in law_name for name in found_names)
        r["search_hit"] = search_hit
        r["search_top1"] = found_names[0] if found_names else ""
        if search_hit:
            search_ok += 1
        else:
            search_fail.append(f"  [{i}] {law_name} → top results: {found_names[:3]}")

        # Test 2: get_article — can we retrieve this article?
        art_result = get_article(law_name, article_no)
        art_found = art_result.get("found", False)
        r["article_found"] = art_found
        r["article_law"] = art_result.get("law_name", "")
        if art_found:
            article_ok += 1
        else:
            article_fail.append(f"  [{i}] {law_name} {article_no} → {art_result.get('error', 'not found')}")

        # Test 3: verify_citation — does full citation verify?
        ver_result = verify_citation(citation)
        ver_valid = ver_result.get("valid", False)
        r["verify_valid"] = ver_valid
        r["verify_law"] = ver_result.get("law_name", "")
        if ver_valid:
            verify_ok += 1
        else:
            verify_fail.append(f"  [{i}] {citation} → {ver_result.get('error', 'invalid')}")

        results.append(r)

    # Save results
    with open(RESULT_FILE, "w") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # Print summary
    total = len(tests)
    print(f"{'='*50}")
    print(f"Law Search Eval ({total} citations)")
    print(f"{'='*50}")
    print(f"search_law P@5:    {search_ok}/{total} ({100*search_ok//total}%)")
    print(f"get_article found: {article_ok}/{total} ({100*article_ok//total}%)")
    print(f"verify_citation:   {verify_ok}/{total} ({100*verify_ok//total}%)")

    if search_fail:
        print(f"\nsearch_law failures ({len(search_fail)}):")
        for f in search_fail[:10]:
            print(f)

    if article_fail:
        print(f"\nget_article failures ({len(article_fail)}):")
        for f in article_fail[:10]:
            print(f)

    if verify_fail:
        print(f"\nverify_citation failures ({len(verify_fail)}):")
        for f in verify_fail[:10]:
            print(f)


if __name__ == "__main__":
    run()
