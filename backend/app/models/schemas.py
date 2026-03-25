from pydantic import BaseModel
from enum import Enum
from typing import Optional


class ReceiverType(str, Enum):
    GOVERNMENT = "政府機關"
    INDIVIDUAL = "人民"
    COMPANY = "企業/公司"
    ORGANIZATION = "團體/協會"
    SCHOOL = "學校"
    PUBLIC = "公眾"


class Direction(str, Enum):
    UPWARD = "上行文"
    PARALLEL = "平行文"
    DOWNWARD = "下行文"


class DocType(str, Enum):
    LETTER = "函"
    INFORMAL_LETTER = "書函"
    MEMO = "簽"
    NOTE = "便簽"
    ANNOUNCEMENT = "公告"
    DECREE = "令"
    MEETING_NOTICE = "開會通知單"


class ActionType(str, Enum):
    NEW_CASE = "新案"
    REPLY = "復函"
    FORWARD = "轉函"
    SEND_DOCS = "檢送文件"
    MEETING = "會議通知"
    PUBLISH_LAW = "公布法令"
    PERSONNEL = "人事命令"
    REPORT = "報告"


class IntentInput(BaseModel):
    user_input: str


class IntentResult(BaseModel):
    sender: str
    receiver: str
    receiver_type: str = "政府機關"
    is_internal: bool = False
    action_type: ActionType
    purpose: str = ""
    subject_brief: str = ""
    reference_doc: Optional[str] = None
    attachments: list[str] = []
    formality: str = "正式"
    # Custom organ support
    sender_level: int = 0       # 0 = auto-detect from registry
    receiver_level: int = 0     # 0 = auto-detect from registry
    sender_parent: str = ""     # parent context for custom organs
    receiver_parent: str = ""   # parent context for custom organs
    # For non-government receivers, the actual display name
    receiver_display_name: str = ""  # e.g., "台積電股份有限公司", "王小明"


class RuleResult(BaseModel):
    direction: Direction
    doc_type: DocType
    phrases: dict  # all the formulaic phrases selected
    template: str  # the rendered template skeleton


class GenerateRequest(BaseModel):
    intent: IntentResult
    # Content fields for LLM to fill (or user manually fills)
    subject_detail: str = ""  # 主旨事項描述
    explanation_items: list[str] = []  # 說明各項
    action_items: list[str] = []  # 辦法/擬辦各項
    recipients_main: list[str] = []  # 正本
    recipients_cc: list[str] = []  # 副本
    # Optional overrides
    doc_date: str = ""  # 發文日期
    doc_number: str = ""  # 發文字號
    speed: str = "普通件"
    attachments_text: str = ""
    # Meeting-specific
    meeting_time: str = ""
    meeting_place: str = ""
    meeting_chair: str = ""
    meeting_contact: str = ""
    meeting_contact_phone: str = ""
    meeting_attendees: list[str] = []
    meeting_observers: list[str] = []
    meeting_notes: str = ""


class GenerateResponse(BaseModel):
    doc_type: DocType
    direction: Direction
    rendered: str  # Full rendered document text
    phrases_used: dict  # Which phrases were applied
    validation_warnings: list[str] = []


# --- Request/Response models for API endpoints ---


class OrganNode(BaseModel):
    name: str
    short_name: str = ""
    level: int = 0
    receiver_type: str = ""
    is_custom: bool = False
    parent_context: str = ""
    children: list["OrganNode"] = []


class DirectionRequest(BaseModel):
    sender: str
    receiver: str
    receiver_type: str = "政府機關"
    sender_level: int = 0
    receiver_level: int = 0
    sender_parent: str = ""
    receiver_parent: str = ""


class DirectionResponse(BaseModel):
    direction: Direction
    is_same_chain: bool
    is_internal: bool
    sender_info: dict
    receiver_info: dict


class PhrasesRequest(BaseModel):
    sender: str
    receiver: str
    action_type: ActionType
    receiver_type: str = "政府機關"
    sender_level: int = 0
    receiver_level: int = 0
    sender_parent: str = ""
    receiver_parent: str = ""


class PhrasesResponse(BaseModel):
    direction: Direction
    is_internal: bool
    phrases: dict
    opening: str
    expectation: str
