"""OpenAI tool schemas + handlers for the law-search functions.

Split out from `law_search.py` so the database/search layer is testable
without coupling to LLM tool conventions.
"""
import json

from app.core.law_search import search_law, get_article, verify_citation


TOOLS: list[dict] = [
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
