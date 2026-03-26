"""Agentic clarification: identify missing info and generate questions."""

from pydantic import BaseModel, Field
from app.core.llm import chat_structured, chat_with_tools_then_structured
from app.core import prompts
from app.core.law_search import TOOLS as LAW_TOOLS, TOOL_HANDLERS as LAW_TOOL_HANDLERS


class QuestionOption(BaseModel):
    label: str = Field(description="選項標籤，1-5個字")
    description: str = Field(description="選項說明，1-2句話")


class ClarifyQuestion(BaseModel):
    question: str = Field(description="問題內容，用繁體中文")
    header: str = Field(description="問題的繁體中文短標題，最多6個中文字")
    field_key: str = Field(description="英文小寫加底線的欄位名")
    options: list[QuestionOption] = Field(description="2-4個選項")


class ClarifyResult(BaseModel):
    needs_clarification: bool = Field(description="是否需要補問")
    questions: list[ClarifyQuestion] = Field(default_factory=list, description="要問的問題，最多4題")
    reasoning: str = Field(default="", description="為什麼需要/不需要補問的理由")


class ContentWithAnswers(BaseModel):
    subject_detail: str = Field(description="主旨事項描述，不含起首語和期望語，50字以內")
    explanation_items: list[str] = Field(description="說明段各項內容，不加編號不加句號")
    action_items: list[str] = Field(default_factory=list, description="辦法/擬辦段各項內容")


def ask_clarification(
    intent: dict, phrases: dict, doc_type: str, direction: str,
    rag_examples: list[str] | None = None,
) -> ClarifyResult:
    """Analyze intent and generate clarifying questions if needed."""
    messages = [
        {"role": "system", "content": prompts.render("clarify_system.j2")},
        {"role": "user", "content": prompts.render(
            "clarify_user.j2",
            intent=intent,
            doc_type=doc_type,
            direction=direction,
            rag_examples=rag_examples,
        )},
    ]

    return chat_structured(messages, ClarifyResult, temperature=0.2)


def generate_with_answers(
    intent: dict,
    phrases: dict,
    doc_type: str,
    direction: str,
    answers: dict[str, str],
    previous_questions: list[dict] | None = None,
    rag_examples: list[str] | None = None,
) -> ContentWithAnswers:
    """Generate content using the original intent + user's clarification answers."""
    # Build answer_labels mapping from field_key to header
    answer_labels = {}
    if previous_questions:
        for q in previous_questions:
            fk = q.get("field_key")
            if fk:
                answer_labels[fk] = q.get("header", fk)

    messages = [
        {"role": "system", "content": prompts.render("generate_system.j2")},
        {"role": "user", "content": prompts.render(
            "generate_user.j2",
            intent=intent,
            phrases=phrases,
            doc_type=doc_type,
            direction=direction,
            answers=answers,
            answer_labels=answer_labels,
            rag_examples=rag_examples,
        )},
    ]

    # Use tool calling to let LLM look up law citations
    result = chat_with_tools_then_structured(
        messages=messages,
        tools=LAW_TOOLS,
        tool_handlers=LAW_TOOL_HANDLERS,
        response_model=ContentWithAnswers,
        temperature=0.3,
        max_rounds=5,
    )

    # Clean items
    def clean(item: str) -> str:
        item = item.strip().rstrip("。")
        for pl in range(1, 5):
            if len(item) > pl and item[:pl + 1].endswith("、"):
                item = item[pl + 1:].strip()
                break
        return item

    result.explanation_items = [clean(i) for i in result.explanation_items if i.strip()]
    result.action_items = [clean(i) for i in result.action_items if i.strip()]

    return result
