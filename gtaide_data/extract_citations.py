"""Extract validated 法規 citations from each normalized document.

Reads gazette + NCHC normalized JSONL, applies a regex to find citation
candidates ("XX法第N條(第M項第K款)"), verifies each via law_search.verify_citation
(handles fuzzy matching + Chinese-number conversion), and writes a sibling
*_v2.jsonl with a new `cited_laws: [{law_name, article_no}]` field per doc.

Only A+B level citations are kept (must include 第N條 or higher precision).
Bare law-name mentions ("依政府採購法") are skipped — too vague to be useful
as a recommendation to the agent.
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

# Add backend to path so we can import law_search
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.core.law_search import load_laws, get_article  # noqa: E402
import app.core.law_search as _law_search  # noqa: E402

# Citation pattern: 法名 (2~30 chars ending with 法/條例/辦法/規則/準則/...) + 第N條 (Arabic or Chinese)
LAW_NAME_PAT = (
    r"[一二三四五六七八九十百千零〇○一-龥A-Za-z0-9]{2,30}?"
    r"(?:法|條例|辦法|規則|準則|綱領|要點|通則|細則|要綱)"
)
ARTICLE_PAT = (
    r"第\s*[\d一二三四五六七八九十百千零]+\s*條"
    r"(?:之[\d一二三四五六七八九十]+)?"
    r"(?:第[\d一二三四五六七八九十百千零]+項)?"
    r"(?:第[\d一二三四五六七八九十百千零]+款)?"
)
CITATION_RE = re.compile(rf"({LAW_NAME_PAT})({ARTICLE_PAT})")


SOURCE_FILES = [
    Path("gazette/gazette_normalized_nchc.jsonl"),
    Path("datasets_from_NCHC/od_normalized.jsonl"),
]


def _doc_text(doc: dict) -> str:
    """Concatenate the searchable fields of a doc into one string for regex scan."""
    parts: list[str] = []
    for key in ("subject", "basis", "purpose"):
        v = doc.get(key)
        if isinstance(v, str):
            parts.append(v)
    for key in ("items", "explanation_items", "action_items"):
        v = doc.get(key)
        if isinstance(v, list):
            for item in v:
                if isinstance(item, str):
                    parts.append(item)
    return "\n".join(parts)


# Pre-built fast indices.
_LAW_NAMES_BY_LEN: list[str] = []  # sorted by length ascending
_LAW_BY_NAME: dict[str, dict] = {}  # name -> law dict (avoids linear scan in get_article)


def build_law_index() -> None:
    global _LAW_NAMES_BY_LEN, _LAW_BY_NAME
    _LAW_BY_NAME = {law["name"]: law for law in _law_search._laws}
    _LAW_NAMES_BY_LEN = sorted(_LAW_BY_NAME.keys(), key=len)


def _fast_get_article(law_name: str, article_part: str) -> dict | None:
    """O(1) law lookup; then linear scan over the law's articles for the matched 條."""
    law = _LAW_BY_NAME.get(law_name)
    if not law:
        return None
    # article_part looks like 第N條 (optionally with 之N / 第M項 / 第K款)
    # Match against law.articles[i].no
    target_no = article_part
    for art in law.get("articles", []):
        no = art.get("no", "")
        if not no:
            continue
        # Article numbers in DB are like "第 5 條" / "第 5 條之 1" — normalize whitespace
        norm_db = no.replace(" ", "")
        norm_target = target_no.split("第")[1].split("項")[0] if "第" in target_no else target_no
        # Simple substring match against the 第N條 prefix
        if target_no.replace(" ", "").startswith(norm_db) or norm_db in target_no.replace(" ", ""):
            return {"law_name": law["name"], "article_no": no}
        # Also accept article_part being a more specific form like 第N條第M項
        if target_no.replace(" ", "").startswith(norm_db):
            return {"law_name": law["name"], "article_no": no}
    return None


def fast_verify(law_name_part: str, article_part: str) -> dict | None:
    """Substring-find shortest law name that contains the fragment + verify article exists."""
    if not _LAW_NAMES_BY_LEN:
        build_law_index()
    if not law_name_part or not article_part:
        return None
    for name in _LAW_NAMES_BY_LEN:
        if law_name_part in name:
            hit = _fast_get_article(name, article_part)
            if hit:
                return hit
            # Try next match — same prefix may be ambiguous
    return None


def extract_citations(text: str, cache: dict | None = None) -> list[dict]:
    """Return list of {law_name, article_no} for every validated citation in text."""
    if cache is None:
        cache = {}
    seen: set[tuple[str, str]] = set()
    out: list[dict] = []
    for m in CITATION_RE.finditer(text):
        law_part = m.group(1).strip()
        art_part = m.group(2).strip()
        cache_key = f"{law_part}|{art_part}"
        if cache_key in cache:
            res = cache[cache_key]
        else:
            res = fast_verify(law_part, art_part)
            cache[cache_key] = res
        if not res:
            continue
        key = (res["law_name"], res.get("article_no", ""))
        if key in seen:
            continue
        seen.add(key)
        out.append(res)
    return out


def process_file(src_path: Path, dst_path: Path, cache: dict) -> dict:
    """Stream src jsonl through citation extraction, write to dst with cited_laws appended."""
    stats = {"total": 0, "with_citations": 0, "total_citations": 0}
    t0 = time.time()
    with src_path.open("r", encoding="utf-8") as f_in, dst_path.open("w", encoding="utf-8") as f_out:
        for line in f_in:
            line = line.strip()
            if not line:
                continue
            try:
                doc = json.loads(line)
            except json.JSONDecodeError:
                continue
            text = _doc_text(doc)
            citations = extract_citations(text, cache=cache) if text else []
            doc["cited_laws"] = citations
            f_out.write(json.dumps(doc, ensure_ascii=False) + "\n")
            stats["total"] += 1
            if citations:
                stats["with_citations"] += 1
                stats["total_citations"] += len(citations)
            if stats["total"] % 5000 == 0:
                elapsed = time.time() - t0
                rate = stats["total"] / max(elapsed, 0.001)
                print(
                    f"  {stats['total']:,} processed | {stats['with_citations']:,} with citations | "
                    f"{rate:.0f} docs/s | cache: {len(cache):,}",
                    flush=True,
                )
    stats["elapsed"] = time.time() - t0
    return stats


def main():
    base = Path(__file__).resolve().parent
    print("Loading law database...", flush=True)
    load_laws()
    build_law_index()
    print(f"Law DB loaded ({len(_LAW_NAMES_BY_LEN):,} unique law names)", flush=True)

    cache: dict[str, dict | None] = {}
    grand_total = 0
    grand_with = 0
    grand_cites = 0
    for rel in SOURCE_FILES:
        src = base / rel
        dst = src.with_name(src.stem + "_v2.jsonl")
        if not src.exists():
            print(f"SKIP (missing): {src}")
            continue
        print(f"\nProcessing {src.name} -> {dst.name}", flush=True)
        stats = process_file(src, dst, cache)
        print(
            f"  done: {stats['total']:,} docs, {stats['with_citations']:,} with citations "
            f"({stats['with_citations'] / max(stats['total'], 1) * 100:.1f}%), "
            f"{stats['total_citations']:,} total citations, "
            f"{stats['elapsed']:.1f}s",
            flush=True,
        )
        grand_total += stats["total"]
        grand_with += stats["with_citations"]
        grand_cites += stats["total_citations"]

    print(
        f"\nGRAND TOTAL: {grand_total:,} docs | {grand_with:,} with citations "
        f"({grand_with / max(grand_total, 1) * 100:.1f}%) | {grand_cites:,} citations | "
        f"cache size: {len(cache):,}"
    )


if __name__ == "__main__":
    main()
