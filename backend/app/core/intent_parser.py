"""Use LLM to parse natural language into structured intent, with tool-based organ lookup."""

import json

from pydantic import BaseModel, Field
from app.core.llm import chat_with_tools, chat_structured
from app.core.organ_registry import get_organ, get_all_organ_names
from app.core import prompts


class ParsedIntent(BaseModel):
    """LLM output schema for intent parsing."""
    sender: str = Field(description="發文機關名稱（必須使用 search_organ 工具確認過的名稱）")
    receiver: str = Field(description="受文機關名稱（必須使用 search_organ 工具確認過的名稱），如果是人民則填「人民」，企業填「企業/公司」，學校填「學校」，團體填「團體/協會」，公眾填「公眾」")
    receiver_type: str = Field(description="受文者類型：政府機關、人民、企業/公司、團體/協會、學校、公眾")
    action_type: str = Field(description="行文類型：新案、復函、轉函、檢送文件、會議通知、公布法令、人事命令、報告")
    doc_type: str = Field(description="建議公文類型：函、書函、簽、便簽、公告、令、開會通知單")
    purpose: str = Field(description="行文目的簡述")
    subject_brief: str = Field(description="主旨摘要，50字以內")
    reference_doc: str = Field(default="", description="引述來文字號，無則留空")
    attachments: list[str] = Field(default_factory=list, description="附件列表")
    formality: str = Field(default="正式", description="正式 或 非正式")
    receiver_display_name: str = Field(default="", description="受文者具體名稱（公司名、人名、校名等），政府機關留空")
    is_internal: bool = Field(default=False, description="是否為同機關內部行文")


# Tool definition for organ search
ORGAN_SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_organ",
        "description": "搜尋系統中的政府機關名稱。輸入機關的關鍵字或簡稱，回傳最符合的機關正式名稱和資訊。發文機關和受文機關都必須用這個工具確認。",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "機關名稱、簡稱或關鍵字，例如「國科會」「經濟部商業發展署」「教育部」"
                }
            },
            "required": ["query"]
        }
    }
}


def _handle_search_organ(query: str) -> str:
    """Tool handler: search for an organ in the registry."""
    organ = get_organ(query)
    if organ:
        return json.dumps({
            "found": True,
            "name": organ.name,
            "short_name": organ.short_name,
            "level": organ.level,
            "parent": organ.parent,
        }, ensure_ascii=False)

    # Not found - return suggestions
    all_names = get_all_organ_names()
    # Simple keyword matching for suggestions
    suggestions = [n for n in all_names if any(c in n for c in query if len(c.encode('utf-8')) > 1)][:5]
    return json.dumps({
        "found": False,
        "query": query,
        "suggestions": suggestions,
        "message": f"找不到「{query}」，請從建議中選擇或直接使用使用者提供的名稱",
    }, ensure_ascii=False)


def parse_intent(
    user_input: str,
    followup_questions: list[str] | None = None,
    followup_answers: list[str] | None = None,
) -> ParsedIntent:
    """Parse natural language input into structured intent using LLM with organ lookup tool."""

    system_content = prompts.render("intent_system.j2")
    system_content += "\n\n重要：對於發文機關和受文機關，你必須先使用 search_organ 工具搜尋確認機關名稱存在於系統中，然後使用工具回傳的正式名稱。如果是非政府機關的受文者（人民、企業等），不需要使用工具。"

    user_content = prompts.render(
        "intent_user.j2",
        user_input=user_input,
        followup_questions=followup_questions,
        followup_answers=followup_answers,
    )

    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_content},
    ]

    # Step 1: Pre-resolve organ names using tool
    # Extract candidate organ names from user input and look them up
    import re
    # Find all potential organ references by looking up common patterns
    resolved_organs = {}
    # Try to find sender/receiver candidates by asking the tool directly
    for candidate in _extract_organ_candidates(user_input):
        result = _handle_search_organ(candidate)
        data = json.loads(result)
        if data.get("found"):
            resolved_organs[candidate] = data["name"]

    # Step 2: Add resolved organs as context for structured output
    organ_context = ""
    if resolved_organs:
        organ_context = "\n\n系統中已確認的機關名稱對照：\n"
        for original, resolved in resolved_organs.items():
            organ_context += f"  「{original}」→ 系統名稱：「{resolved}」\n"
        organ_context += "請使用「系統名稱」欄位的名稱填入 sender 和 receiver。"

    parse_messages = [
        {"role": "system", "content": system_content + organ_context},
        {"role": "user", "content": user_content},
    ]

    return chat_structured(parse_messages, ParsedIntent, temperature=0.1)


def _extract_organ_candidates(text: str) -> list[str]:
    """Extract potential organ name candidates from user text."""
    candidates = []

    # Common patterns: 我是X, X要發, 給X, 發函給X
    import re
    patterns = [
        r"我是(.+?)[，,]",
        r"我是(.+?)要",
        r"發[函文]給(.+?)[，,]",
        r"給(.+?)[，,]",
        r"簽報(.+?)[，,]",
        r"檢送.*給(.+?)[ ，,]",
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text)
        candidates.extend(matches)

    # Also try splitting by common delimiters and testing each segment
    for seg in re.split(r"[，,。、]", text):
        seg = seg.strip()
        if 2 <= len(seg) <= 15:
            from app.core.organ_registry import get_organ
            if get_organ(seg):
                candidates.append(seg)

    return list(dict.fromkeys(candidates))  # dedupe preserving order
