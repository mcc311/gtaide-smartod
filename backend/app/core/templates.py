from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.models.schemas import DocType, GenerateRequest

_TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

_CN_NUMBERS = [
    "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
]


def _cn_number(index: int, level: int = 1) -> str:
    num = _CN_NUMBERS[index] if index < len(_CN_NUMBERS) else str(index + 1)
    if level == 1:
        return f"{num}、"
    return f"({num})"


def _trim_period(text: str) -> str:
    return text.rstrip("。")


def _to_roc_date(iso_date: str) -> str:
    """Convert ISO date (YYYY-MM-DD) to ROC format (中華民國YYY年MM月DD日)."""
    if not iso_date or "中華民國" in iso_date:
        return iso_date  # Already ROC format or empty
    try:
        parts = iso_date.split("-")
        year = int(parts[0]) - 1911
        return f"中華民國{year}年{parts[1]}月{parts[2]}日"
    except (ValueError, IndexError):
        return iso_date


_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    keep_trailing_newline=False,
    trim_blocks=True,
    lstrip_blocks=True,
)
_env.globals["cn_number"] = _cn_number
_env.filters["trim_period"] = _trim_period
_env.filters["roc_date"] = _to_roc_date


def _build_context(phrases: dict, req: GenerateRequest) -> dict:
    """Build the common template context from phrases + request."""
    expectation = phrases.get("期望語", "")

    # 簽 uses a trimmed expectation: 請鑒核 → 鑒核
    memo_expectation = expectation
    if memo_expectation.startswith("請"):
        memo_expectation = memo_expectation[1:]

    # Use display name for the actual document
    receiver_for_doc = req.intent.receiver_display_name or req.intent.receiver
    if req.intent.receiver_display_name and req.intent.receiver_type == "人民":
        receiver_for_doc = f"{req.intent.receiver_display_name} 君"

    recipients_main = "、".join(req.recipients_main) if req.recipients_main else receiver_for_doc
    recipients_cc = "、".join(req.recipients_cc) if req.recipients_cc else ""

    # 便簽: combine all items
    all_items = [f"本件係{req.subject_detail}案"] + list(req.explanation_items) + list(req.action_items)

    # 公告
    basis = req.intent.reference_doc or ""
    announcement_items = list(req.explanation_items)

    # 開會通知單
    attendees = "、".join(req.meeting_attendees) if req.meeting_attendees else ""
    observers = "、".join(req.meeting_observers) if req.meeting_observers else ""

    return {
        "sender": req.intent.sender,
        "receiver": receiver_for_doc,
        "doc_date": _to_roc_date(req.doc_date),
        "doc_number": req.doc_number,
        "speed": req.speed,
        "attachment_line": req.attachments_text,
        "opening": phrases.get("開頭語", ""),
        "subject_detail": req.subject_detail,
        "expectation": expectation,
        "memo_expectation": memo_expectation,
        "explanation_items": list(req.explanation_items),
        "action_items": list(req.action_items),
        "recipients_main": recipients_main,
        "recipients_cc": recipients_cc,
        # 便簽
        "all_items": all_items,
        # 公告
        "basis": basis,
        "announcement_items": announcement_items,
        # 開會通知單
        "meeting_time": req.meeting_time,
        "meeting_place": req.meeting_place,
        "meeting_chair": req.meeting_chair,
        "meeting_contact": req.meeting_contact,
        "meeting_contact_phone": req.meeting_contact_phone,
        "attendees": attendees,
        "observers": observers,
        "meeting_notes": req.meeting_notes,
    }


_TEMPLATE_MAP = {
    DocType.LETTER: "函.j2",
    DocType.INFORMAL_LETTER: "書函.j2",
    DocType.MEMO: "簽.j2",
    DocType.NOTE: "便簽.j2",
    DocType.ANNOUNCEMENT: "公告.j2",
    DocType.DECREE: "令.j2",
    DocType.MEETING_NOTICE: "開會通知單.j2",
}


def render_document(doc_type: DocType, phrases: dict, request: GenerateRequest) -> str:
    template_name = _TEMPLATE_MAP.get(doc_type)
    if not template_name:
        return f"[不支援的公文類型：{doc_type.value}]"

    template = _env.get_template(template_name)
    ctx = _build_context(phrases, request)
    return template.render(**ctx).strip()
