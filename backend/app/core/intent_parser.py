"""Use LLM to parse natural language into structured intent."""

from pydantic import BaseModel, Field
from app.core.llm import chat_structured
from app.core.organ_registry import get_all_organ_names
from app.core import prompts


class ParsedIntent(BaseModel):
    """LLM output schema for intent parsing."""
    sender: str = Field(description="發文機關名稱（必須使用系統機關列表中的名稱）")
    receiver: str = Field(description="受文機關名稱（必須使用系統機關列表中的名稱），如果是人民則填「人民」，企業填「企業/公司」，學校填「學校」，團體填「團體/協會」，公眾填「公眾」")
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


def _build_organ_list() -> str:
    """Build a compact organ name list for the prompt."""
    names = sorted(get_all_organ_names())
    return "、".join(names)


def parse_intent(
    user_input: str,
    followup_questions: list[str] | None = None,
    followup_answers: list[str] | None = None,
) -> ParsedIntent:
    """Parse natural language input into structured intent using LLM."""
    messages = [
        {"role": "system", "content": prompts.render(
            "intent_system.j2",
            organ_list=_build_organ_list(),
        )},
        {"role": "user", "content": prompts.render(
            "intent_user.j2",
            user_input=user_input,
            followup_questions=followup_questions,
            followup_answers=followup_answers,
        )},
    ]
    return chat_structured(messages, ParsedIntent, temperature=0.1)
