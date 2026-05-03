"""Single source of truth for the agent's edit tools.

Both `chat_edit.py` (for tool definitions + handlers) and the frontend
(via /api/edit-tool-catalog) consume this catalog so adding a new tool
or field requires changes in only one place.
"""
from typing import Literal


# Field name -> "scalar" | "array". Listed for every possible target field
# of the edit tools. The frontend uses this to validate edit responses
# and dispatch to hook.update.
FIELD_KINDS: dict[str, Literal["scalar", "array"]] = {
    # update_subject
    "subject_detail": "scalar",
    # update_explanation
    "explanation_items": "array",
    # update_action
    "action_items": "array",
    # update_recipients (role -> field)
    "recipients_main": "array",
    "recipients_cc": "array",
    # update_meta
    "doc_date": "scalar",
    "doc_number": "scalar",
    "speed": "scalar",
    "attachments_text": "scalar",
    # update_meeting
    "meeting_time": "scalar",
    "meeting_place": "scalar",
    "meeting_chair": "scalar",
    "meeting_contact": "scalar",
    "meeting_contact_phone": "scalar",
    "meeting_notes": "scalar",
}


# OpenAI tool schemas for the edit tools (does NOT include law tools or ask_user;
# those are handled separately because their interface differs).
EDIT_TOOLS: list[dict] = [
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
                "properties": {"items": {"type": "array", "items": {"type": "string"}}},
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
                "properties": {"items": {"type": "array", "items": {"type": "string"}}},
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
                        "enum": ["doc_date", "doc_number", "speed", "attachments_text"],
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
]


META_FIELDS = {"doc_date", "doc_number", "speed", "attachments_text"}
MEETING_FIELDS = {
    "meeting_time",
    "meeting_place",
    "meeting_chair",
    "meeting_contact",
    "meeting_contact_phone",
    "meeting_notes",
}
