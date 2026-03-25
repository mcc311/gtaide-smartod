"""Use LLM to generate document content fields, given intent and phrases."""

from pydantic import BaseModel, Field
from app.core.llm import chat_structured
from app.core import prompts


class GeneratedContent(BaseModel):
    """LLM output schema for content generation."""
    subject_detail: str = Field(description="主旨事項描述，不含起首語和期望語，50字以內，精簡扼要")
    explanation_items: list[str] = Field(description="說明段各項內容，不加編號，不加句號")
    action_items: list[str] = Field(default_factory=list, description="辦法/擬辦段各項內容，不加編號，不加句號")


def generate_content(
    intent: dict,
    phrases: dict,
    doc_type: str,
    direction: str,
    is_internal: bool,
    rag_examples: list[str] | None = None,
) -> GeneratedContent:
    """Generate document content fields using LLM."""

    messages = [
        {"role": "system", "content": prompts.render("content_system.j2")},
        {"role": "user", "content": prompts.render(
            "content_user.j2",
            intent=intent,
            phrases=phrases,
            doc_type=doc_type,
            direction=direction,
            is_internal=is_internal,
            rag_examples=rag_examples,
        )},
    ]

    result = chat_structured(messages, GeneratedContent, temperature=0.3)

    # Clean up: remove trailing periods and numbering that LLM might add
    def clean_item(item: str) -> str:
        item = item.strip().rstrip("。")
        for prefix_len in range(1, 5):
            if len(item) > prefix_len and item[:prefix_len + 1].endswith("、"):
                item = item[prefix_len + 1:].strip()
                break
        return item

    result.explanation_items = [clean_item(i) for i in result.explanation_items if i.strip()]
    result.action_items = [clean_item(i) for i in result.action_items if i.strip()]

    return result
