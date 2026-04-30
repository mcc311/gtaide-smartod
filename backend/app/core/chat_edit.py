"""Tool-calling chat-edit: LLM revises specific fields of a 公文 draft."""
import json
import uuid
from dataclasses import dataclass
from pathlib import Path

from jinja2 import Template

from app.core.law_search import (
    TOOLS as LAW_TOOLS,
    TOOL_HANDLERS as LAW_TOOL_HANDLERS,
)
from app.models.schemas import ChatEditRequest

_PROMPT_PATH = (
    Path(__file__).parent.parent / "templates" / "prompts" / "chat_edit_system.j2"
)


# OpenAI-style tool schemas
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "update_subject",
            "description": "Replace the 主旨 (subject) field with new text.",
            "parameters": {
                "type": "object",
                "properties": {"text": {"type": "string"}},
                "required": ["text"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_explanation",
            "description": "Replace ALL 說明/依據 items. Pass the complete new list including unchanged items.",
            "parameters": {
                "type": "object",
                "properties": {
                    "items": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["items"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_action",
            "description": "Replace ALL 辦法/公告事項/擬辦 items.",
            "parameters": {
                "type": "object",
                "properties": {
                    "items": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["items"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_recipients",
            "description": "Replace 正本 (role=main) or 副本 (role=cc) recipients list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "role": {"type": "string", "enum": ["main", "cc"]},
                    "names": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["role", "names"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_meta",
            "description": "Update document metadata: 發文日期/發文字號/速別/附件文字。",
            "parameters": {
                "type": "object",
                "properties": {
                    "field": {
                        "type": "string",
                        "enum": [
                            "doc_date",
                            "doc_number",
                            "speed",
                            "attachments_text",
                        ],
                    },
                    "value": {"type": "string"},
                },
                "required": ["field", "value"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_meeting",
            "description": "Update 開會通知單 specific field. Only valid when doc_type is 開會通知單.",
            "parameters": {
                "type": "object",
                "properties": {
                    "field": {
                        "type": "string",
                        "enum": [
                            "meeting_time",
                            "meeting_place",
                            "meeting_chair",
                            "meeting_contact",
                            "meeting_contact_phone",
                            "meeting_notes",
                        ],
                    },
                    "value": {"type": "string"},
                },
                "required": ["field", "value"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ask_user",
            "description": (
                "Ask the user a clarifying question when you lack information needed "
                "to draft or edit. The question becomes the next assistant turn. "
                "If `options` are provided, they render as clickable shortcuts; "
                "the user can also type a free-text answer. Use sparingly — only "
                "when the missing info is truly load-bearing for the document."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "description": "The question text shown in chat"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional 2-5 short shortcut answers (≤8 Chinese chars each)"
                    }
                },
                "required": ["question"]
            }
        }
    },
]

TOOLS = TOOLS + LAW_TOOLS


@dataclass
class ChatEditOutcome:
    edits: list[dict]
    assistant_message: str
    pending: dict | None  # {"question": str, "options": list[str] | None} when ask_user was called


# In-memory per-session conversation store (excludes system prompt — rebuilt per turn).
# Each entry is a list of OpenAI-format messages (user / assistant with tool_calls / tool / assistant final).
_conversations: dict[str, list[dict]] = {}

MAX_TOOL_ROUNDS = 6


def chat_edit(req: ChatEditRequest) -> "tuple[ChatEditOutcome, str]":
    """Run the agent. Returns (outcome, session_id).

    Maintains a per-session conversation in `_conversations` so the LLM sees
    its own previous tool calls (preventing repeated questions).
    """
    from app.core.llm import _client, MODEL
    edits: list[dict] = []
    pending: dict | None = None

    def _ok():
        return json.dumps({"ok": True})

    def update_subject(text: str) -> str:
        edits.append({"field": "subject_detail", "value": text})
        return _ok()

    def update_explanation(items: list[str]) -> str:
        edits.append({"field": "explanation_items", "value": items})
        return _ok()

    def update_action(items: list[str]) -> str:
        edits.append({"field": "action_items", "value": items})
        return _ok()

    def update_recipients(role: str, names: list[str]) -> str:
        if role not in {"main", "cc"}:
            return json.dumps({"error": f"unknown role: {role}"})
        edits.append({"field": f"recipients_{role}", "value": names})
        return _ok()

    def update_meta(field: str, value: str) -> str:
        if field not in {"doc_date", "doc_number", "speed", "attachments_text"}:
            return json.dumps({"error": f"unknown meta field: {field}"})
        edits.append({"field": field, "value": value})
        return _ok()

    def update_meeting(field: str, value: str) -> str:
        if field not in {
            "meeting_time",
            "meeting_place",
            "meeting_chair",
            "meeting_contact",
            "meeting_contact_phone",
            "meeting_notes",
        }:
            return json.dumps({"error": f"unknown meeting field: {field}"})
        edits.append({"field": field, "value": value})
        return _ok()

    def ask_user(question: str, options: list[str] | None = None) -> str:
        nonlocal pending
        pending = {"question": question, "options": options or None}
        return _ok()

    handlers = {
        "update_subject": update_subject,
        "update_explanation": update_explanation,
        "update_action": update_action,
        "update_recipients": update_recipients,
        "update_meta": update_meta,
        "update_meeting": update_meeting,
        "ask_user": ask_user,
    }
    handlers = {**handlers, **LAW_TOOL_HANDLERS}

    # Resolve session
    session_id = (req.session_id or "").strip()
    if not session_id or session_id not in _conversations:
        session_id = str(uuid.uuid4())
        _conversations[session_id] = []
    history = _conversations[session_id]

    # Build messages (system rendered per-turn from current state; history is reused)
    template = Template(_PROMPT_PATH.read_text(encoding="utf-8"))
    system_prompt = template.render(
        intent=req.intent,
        phrases=req.phrases,
        doc_type=req.doc_type,
        direction=req.direction,
        subtype=req.subtype,
        subject_detail=req.subject_detail,
        explanation_items=req.explanation_items,
        action_items=req.action_items,
        doc_date=req.doc_date,
        doc_number=req.doc_number,
        speed=req.speed,
        attachments_text=req.attachments_text,
        recipients_main=req.recipients_main,
        recipients_cc=req.recipients_cc,
        meeting_time=req.meeting_time,
        meeting_place=req.meeting_place,
        meeting_chair=req.meeting_chair,
        meeting_contact=req.meeting_contact,
        meeting_contact_phone=req.meeting_contact_phone,
        meeting_notes=req.meeting_notes,
    )

    new_user_msg = {
        "role": "user",
        "content": req.user_message or "（請評估目前狀態並決定下一步）",
    }
    messages = [{"role": "system", "content": system_prompt}, *history, new_user_msg]
    new_messages: list[dict] = [new_user_msg]

    assistant_text = ""
    for _ in range(MAX_TOOL_ROUNDS):
        resp = _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.3,
            tools=TOOLS,
        )
        msg = resp.choices[0].message
        msg_dict = msg.model_dump()

        if not msg.tool_calls:
            # Final natural-language assistant turn
            assistant_text = msg.content or ""
            messages.append(msg_dict)
            new_messages.append(msg_dict)
            break

        # Append assistant turn (with tool_calls) and execute each tool
        messages.append(msg_dict)
        new_messages.append(msg_dict)
        for tc in msg.tool_calls:
            fn_name = tc.function.name
            try:
                fn_args = json.loads(tc.function.arguments) if tc.function.arguments else {}
            except json.JSONDecodeError:
                fn_args = {}
            handler = handlers.get(fn_name)
            try:
                result = handler(**fn_args) if handler else f"Unknown tool: {fn_name}"
            except Exception as exc:
                result = json.dumps({"error": f"{type(exc).__name__}: {exc}"})
            tool_msg = {
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result if isinstance(result, str) else json.dumps(result, ensure_ascii=False),
            }
            messages.append(tool_msg)
            new_messages.append(tool_msg)
    else:
        # Max rounds without a non-tool-call response — fabricate a closing message
        assistant_text = "（已達最多工具呼叫輪數，請使用者繼續描述需求）"
        new_messages.append({"role": "assistant", "content": assistant_text})

    # Persist new turns
    _conversations[session_id].extend(new_messages)

    return (
        ChatEditOutcome(edits=edits, assistant_message=assistant_text, pending=pending),
        session_id,
    )
