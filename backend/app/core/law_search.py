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


def suggest_laws(
    subject_brief: str,
    doc_type: str = "",
    subtype: str = "",
    organ: str = "",
    top_k: int = 3,
) -> list[dict]:
    """Suggest relevant laws based on document intent.

    Uses LLM-free heuristic: extract keywords from subject,
    search laws, and return top matches with relevant articles.
    """
    if not _loaded:
        load_laws()

    # Build search queries from subject + subtype
    queries = []
    if subject_brief:
        queries.append(subject_brief)
    if subtype and subtype not in subject_brief:
        queries.append(subtype)

    # Common law patterns by subtype
    SUBTYPE_LAWS = {
        "公示送達": ["行政程序法"],
        "預告法規": ["行政程序法"],
        "法規修正": [],
        "法規訂定": [],
        "法規廢止": [],
    }
    extra = SUBTYPE_LAWS.get(subtype, [])
    queries.extend(extra)

    # Determine category from organ
    category_prefix = ""
    if organ:
        # Try to find matching category
        for law in _laws[:100]:  # Quick scan
            if organ in law.get("category", ""):
                parts = law["category"].split("＞")
                if len(parts) >= 2:
                    category_prefix = f"{parts[0]}＞{parts[1]}"
                break

    # Search and collect unique laws
    seen = set()
    suggestions = []
    for query in queries:
        results = search_law(query, category_prefix=category_prefix, top_k=5)
        for r in results:
            if r["name"] not in seen and r["relevance"] >= 30:
                seen.add(r["name"])
                # Find relevant articles by keyword matching
                law = next((l for l in _laws if l["name"] == r["name"]), None)
                articles = []
                if law:
                    # Score each article by keyword overlap with subject
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
                    for _, a in scored[:3]:
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


# Tool definitions for LLM
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_law",
            "description": "搜尋台灣法規資料庫（11,752部）。建議帶 category_prefix 限縮搜尋範圍。常用類別：行政＞勞動部、行政＞經濟部＞商業目、行政＞衛生福利部＞食品藥物管理目、行政＞財政部＞賦稅目、行政＞內政部＞警政目。",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "法規關鍵字，例如「勞工保險」「公司法」「食品安全」"
                    },
                    "category_prefix": {
                        "type": "string",
                        "description": "類別前綴，限縮搜尋範圍。如「行政＞勞動部」「行政＞經濟部＞商業目」。留空搜全部。"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_article",
            "description": "取得特定法規的條文內容。先用 search_law 找到正確法規名稱後，再用此工具查詢具體條文。",
            "parameters": {
                "type": "object",
                "properties": {
                    "law_name": {
                        "type": "string",
                        "description": "法規全名，例如「勞工保險條例」"
                    },
                    "article_no": {
                        "type": "string",
                        "description": "條號，例如「第20條」。留空則回傳前5條預覽。"
                    }
                },
                "required": ["law_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "verify_citation",
            "description": "驗證法規引用是否正確。輸入完整引用文字，回傳是否有效及條文內容。",
            "parameters": {
                "type": "object",
                "properties": {
                    "citation": {
                        "type": "string",
                        "description": "完整法規引用，例如「勞工保險條例第20條」「行政程序法第154條第1項」"
                    }
                },
                "required": ["citation"]
            }
        }
    },
]

TOOL_HANDLERS = {
    "search_law": lambda **kwargs: json.dumps(search_law(**kwargs), ensure_ascii=False),
    "get_article": lambda **kwargs: json.dumps(get_article(**kwargs), ensure_ascii=False),
    "verify_citation": lambda **kwargs: json.dumps(verify_citation(**kwargs), ensure_ascii=False),
}
