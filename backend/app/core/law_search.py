"""Local law database search for tool calling.

Loads 全國法規資料庫 (law.moj.gov.tw) JSON data and provides
fast keyword search for law names and article content.
"""

import json
import logging
import re
from pathlib import Path

import jieba

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "gtaide_data" / "laws"
_LAW_FILES = ["ChLaw.json", "ChOrder.json"]

# In-memory index
_laws: list[dict] = []  # {name, level, category, articles: [{no, content}]}
_loaded = False


def load_laws():
    """Load law database into memory."""
    global _laws, _loaded

    if _loaded:
        return

    for filename in _LAW_FILES:
        filepath = _DATA_DIR / filename
        if not filepath.exists():
            logger.warning(f"Law file not found: {filepath}")
            continue

        logger.info(f"Loading {filepath.name}...")
        with open(filepath, encoding="utf-8-sig") as f:
            data = json.load(f)

        for law in data.get("Laws", []):
            articles = []
            for art in law.get("LawArticles", []):
                no = art.get("ArticleNo", "").strip()
                content = art.get("ArticleContent", "").strip()
                if content:
                    articles.append({"no": no, "content": content})

            _laws.append({
                "name": law.get("LawName", ""),
                "level": law.get("LawLevel", ""),
                "category": law.get("LawCategory", ""),
                "articles": articles,
            })

        logger.info(f"  Loaded {len(data.get('Laws', []))} from {filepath.name}")

    _loaded = True
    logger.info(f"Total laws loaded: {len(_laws)}")


def search_law(query: str, category_prefix: str = "", top_k: int = 5) -> list[dict]:
    """Search laws by name keyword matching, optionally scoped to a category.

    Args:
        query: keyword to search in law names
        category_prefix: category prefix to filter (e.g. "行政＞勞動部")
        top_k: max results

    Returns list of {name, level, category, article_count, relevance}.
    """
    if not _loaded:
        load_laws()

    query_lower = query.lower()
    query_tokens = set(jieba.cut(query))

    candidates = _laws
    if category_prefix:
        candidates = [l for l in _laws if l["category"].startswith(category_prefix)]

    results = []
    for law in candidates:
        name = law["name"]
        name_lower = name.lower()

        # Exact name match (highest priority)
        if query == name:
            score = 200
        # Exact substring match in name
        elif query in name:
            # Prefer shorter names (more specific match)
            score = 150 - len(name)
        elif query_lower in name_lower:
            score = 90 - len(name)
        else:
            # Token overlap
            name_tokens = set(jieba.cut(name))
            overlap = len(query_tokens & name_tokens)
            if overlap == 0:
                continue
            score = overlap * 10

        results.append({
            "name": name,
            "level": law["level"],
            "category": law["category"],
            "article_count": len(law["articles"]),
            "relevance": score,
        })

    results.sort(key=lambda x: x["relevance"], reverse=True)
    return results[:top_k]


def get_article(law_name: str, article_no: str = "") -> dict:
    """Get specific article(s) from a law.

    If article_no is empty, returns all articles.
    article_no can be like "第5條", "5", "第5條第2項".
    """
    if not _loaded:
        load_laws()

    # Find the law (exact match first, then substring)
    law = None
    for l in _laws:
        if l["name"] == law_name:
            law = l
            break
    if not law:
        # Substring match, prefer shortest name (most specific)
        candidates = [l for l in _laws if law_name in l["name"]]
        if candidates:
            candidates.sort(key=lambda l: len(l["name"]))
            law = candidates[0]

    if not law:
        return {"found": False, "error": f"找不到法規「{law_name}」"}

    articles = law["articles"]

    if not article_no:
        # Return first 5 articles as preview
        return {
            "found": True,
            "law_name": law["name"],
            "total_articles": len(articles),
            "articles": [
                {"no": a["no"], "content": a["content"][:200]}
                for a in articles[:5]
            ],
        }

    # Convert Chinese numbers to Arabic: 五十一 → 51
    def _cn_to_num(s: str) -> str:
        cn_map = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10, "百": 100, "零": 0}
        # Simple conversion for common patterns
        s = s.strip()
        if not s:
            return ""
        total = 0
        current = 0
        for ch in s:
            if ch in cn_map:
                val = cn_map[ch]
                if val >= 10:
                    current = current or 1
                    total += current * val
                    current = 0
                else:
                    current = val
            elif ch.isdigit():
                return re.sub(r"\D", "", s)  # Already has Arabic digits
        total += current
        return str(total) if total > 0 else ""

    # Normalize article number: "第5條" → "5", "第五十一條" → "51"
    normalized = re.sub(r"第\s*(\d+)\s*條.*", r"\1", article_no)
    if not normalized.isdigit():
        # Try Chinese number
        cn_match = re.search(r"第\s*([一二三四五六七八九十百零]+)\s*條", article_no)
        if cn_match:
            normalized = _cn_to_num(cn_match.group(1))
        else:
            normalized = re.sub(r"\D", "", article_no)

    # Search for matching article
    for a in articles:
        a_num = re.sub(r"\D", "", a["no"])
        if a_num == normalized or a["no"].strip() == article_no.strip():
            return {
                "found": True,
                "law_name": law["name"],
                "article_no": a["no"],
                "content": a["content"],
            }

    return {
        "found": False,
        "law_name": law["name"],
        "error": f"找不到{article_no}",
        "available_articles": [a["no"] for a in articles[:10]],
    }


def verify_citation(citation: str) -> dict:
    """Verify if a law citation like "勞工保險條例第20條" is valid.

    Returns {valid, law_name, article_no, content} or {valid: False, suggestion}.
    """
    if not _loaded:
        load_laws()

    # Parse citation: "○○法第○條" (supports both 阿拉伯 and 中文 numbers)
    match = re.match(r"(.+?)(第\s*[\d一二三四五六七八九十百零]+\s*條(?:之[\d一二三四五六七八九十]+)?.*)?$", citation)
    if not match:
        return {"valid": False, "error": "無法解析引用格式"}

    law_name_part = match.group(1).strip()
    article_part = match.group(2) or ""
    article_part = article_part.strip()

    # Find matching law
    candidates = search_law(law_name_part, top_k=3)
    if not candidates:
        return {"valid": False, "error": f"找不到法規「{law_name_part}」"}

    best = candidates[0]
    if best["relevance"] < 20:
        return {
            "valid": False,
            "error": f"找不到完全匹配的法規",
            "suggestions": [c["name"] for c in candidates],
        }

    if article_part:
        result = get_article(best["name"], article_part)
        if result.get("found"):
            return {
                "valid": True,
                "law_name": result["law_name"],
                "article_no": result.get("article_no", article_part),
                "content": result.get("content", "")[:300],
            }
        else:
            return {
                "valid": False,
                "law_name": best["name"],
                "error": f"法規存在但{result.get('error', '條文不存在')}",
            }
    else:
        return {
            "valid": True,
            "law_name": best["name"],
            "article_count": best["article_count"],
        }


def get_law_categories() -> list[dict]:
    """Return law category tree for browsing UI (3-level: branch > dept > section)."""
    if not _loaded:
        load_laws()

    from collections import defaultdict
    tree: dict = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    for law in _laws:
        cat = law.get("category", "")
        if cat.startswith("廢止"):
            continue
        parts = cat.split("＞")
        branch = parts[0] if parts else ""
        dept = parts[1] if len(parts) > 1 else ""
        section = parts[2] if len(parts) > 2 else ""
        if branch and dept:
            tree[branch][dept][section] += 1
        elif branch:
            tree[branch][""][""] += 1

    result = []
    for branch in ["憲法", "行政", "立法", "司法", "考試", "監察", "總統"]:
        if branch not in tree:
            continue
        depts = tree[branch]
        branch_total = sum(sum(secs.values()) for secs in depts.values())
        dept_children = []
        for dept in sorted(depts.keys()):
            if not dept:
                continue
            sections = depts[dept]
            dept_total = sum(sections.values())
            sec_children = [{"name": s, "count": c} for s, c in sorted(sections.items()) if s]
            dept_children.append({"name": dept, "count": dept_total, "children": sec_children})
        result.append({"name": branch, "count": branch_total, "children": dept_children})
    return result


def browse_laws_by_category(category_prefix: str, top_k: int = 200) -> list[dict]:
    """List laws under a category prefix."""
    if not _loaded:
        load_laws()

    results = []
    for law in _laws:
        cat = law.get("category", "")
        if cat.startswith("廢止"):
            continue
        if cat.startswith(category_prefix) or category_prefix in cat:
            results.append({
                "law_name": law["name"],
                "category": cat,
                "article_count": len(law["articles"]),
                "articles": [],
            })
            if len(results) >= top_k:
                break
    return results


# Multi-character domain phrases that tend to appear in both subjects and law names.
# When any of these substrings is in subject_brief, treat as a strong query signal.
# Keep ordered most-specific-first so the substring-matching naturally prefers
# the more specific phrase when both apply (e.g., "最有利標" before "標").
HIGH_SIGNAL_KEYWORDS: list[str] = [
    # 採購
    "最有利標", "公開招標", "限制性招標", "選擇性招標",
    "採購", "招標", "決標", "評選", "投標", "押標金", "履約",
    # 行政程序
    "公示送達", "聽證", "陳情", "訴願", "聲明異議",
    "行政處分", "罰鍰", "行政罰", "怠金", "代履行",
    # 勞動
    "勞工保險", "勞動基準", "職災", "退休金",
    "勞工", "勞動", "投保", "退保", "勞保",
    "性別工作平等", "職業安全衛生",
    # 財政
    "預算", "決算", "審計", "會計",
    "所得稅", "營業稅", "綜合所得", "稅捐", "稅務",
    # 工程／土地
    "建築", "建造", "都市計畫", "土地徵收",
    "公共工程", "工程契約",
    # 人事
    "公務員", "考績", "陞遷", "懲戒", "聘僱",
    # 資訊與個資
    "政府資訊公開", "個人資料保護", "個人資料", "資訊安全",
    # 環境
    "環境影響", "污染防制", "排放標準", "廢棄物",
    # 醫衛
    "藥事", "醫療", "醫師", "傳染病",
    # 教育
    "教師", "學生輔導", "高級中等學校",
    # 交通
    "道路交通", "車輛", "公路",
    # 公司／商業
    "公司登記", "商業登記",
]


def suggest_laws(
    subject_brief: str,
    doc_type: str = "",
    subtype: str = "",
    organ: str = "",
    top_k: int = 3,
) -> list[dict]:
    """Suggest relevant laws based on document intent."""
    if not _loaded:
        load_laws()

    # Build search queries — prefer extracted high-signal keywords over the raw subject
    queries: list[str] = []
    seen_q: set[str] = set()

    def _add_query(q: str) -> None:
        if q and q not in seen_q:
            seen_q.add(q)
            queries.append(q)

    # 1. Subtype-specific known laws — highest-confidence signal, always first
    SUBTYPE_LAWS = {
        "公示送達": ["行政程序法"],
        "預告法規": ["行政程序法"],
        "法規修正": [],
        "法規訂定": [],
        "法規廢止": [],
    }
    for q in SUBTYPE_LAWS.get(subtype, []):
        _add_query(q)

    # 2. Extract domain keywords from organ name (e.g. "勞工保險局" → "勞工保險").
    #     Organ context is a strong, domain-specific signal — process before subject keywords
    #     so it isn't crowded out by generic subject tokens like "投保" / "退保".
    if organ:
        for kw in HIGH_SIGNAL_KEYWORDS:
            if kw in organ:
                _add_query(kw)

    # 3. Extract domain keywords from subject (most-specific first per HIGH_SIGNAL_KEYWORDS ordering)
    for kw in HIGH_SIGNAL_KEYWORDS:
        if kw in subject_brief:
            _add_query(kw)

    # 4. Subtype itself if not already added and not in subject
    if subtype and subtype not in subject_brief:
        _add_query(subtype)

    # 5. Fallback: use subject_brief if no domain keyword extracted
    if not queries and subject_brief:
        _add_query(subject_brief)

    # Determine category from organ (unchanged)
    category_prefix = ""
    if organ:
        for law in _laws[:100]:
            if organ in law.get("category", ""):
                parts = law["category"].split("＞")
                if len(parts) >= 2:
                    category_prefix = f"{parts[0]}＞{parts[1]}"
                break

    # Search and collect unique laws (existing logic — copy from current implementation,
    # but be defensive: keep the existing relevance threshold AND article-extraction logic)
    seen = set()
    suggestions = []
    for query in queries:
        results = search_law(query, category_prefix=category_prefix, top_k=5)
        for r in results:
            if r["name"] not in seen and r["relevance"] >= 30:
                seen.add(r["name"])
                law = next((l for l in _laws if l["name"] == r["name"]), None)
                articles = []
                if law:
                    subject_tokens = set(jieba.cut(subject_brief))
                    scored = []
                    for a in law["articles"]:
                        if not a["no"] or not a["content"]:
                            continue
                        a_tokens = set(jieba.cut(a["content"][:200]))
                        overlap = len(subject_tokens & a_tokens)
                        if overlap >= 2:
                            scored.append((overlap, a))
                    scored.sort(key=lambda x: x[0], reverse=True)
                    # If no articles overlap >=2, fall back to first 3 articles so the card
                    # isn't empty
                    fallback = [(0, a) for a in law["articles"][:3] if a["no"] and a["content"]]
                    chosen = scored[:3] if scored else fallback
                    for _, a in chosen:
                        articles.append({
                            "no": a["no"],
                            "content": a["content"][:150],
                        })
                suggestions.append({
                    "law_name": r["name"],
                    "category": r["category"],
                    "article_count": r["article_count"],
                    "articles": articles,
                })
                if len(suggestions) >= top_k:
                    break
        if len(suggestions) >= top_k:
            break

    return suggestions
