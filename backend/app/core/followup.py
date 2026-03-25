"""Generate follow-up questions based on user's initial input."""

from pydantic import BaseModel, Field
from app.core.llm import chat_structured
from app.core import prompts


class FollowUpQuestions(BaseModel):
    questions: list[str] = Field(description="3-5個需要使用者補充的繁體中文問題")


def generate_followup(user_input: str, rag_examples: list[str] | None = None) -> FollowUpQuestions:
    """Generate follow-up questions for the user's initial input."""
    messages = [
        {"role": "system", "content": prompts.render("followup_system.j2")},
        {"role": "user", "content": prompts.render(
            "followup_user.j2",
            user_input=user_input,
            rag_examples=rag_examples,
        )},
    ]
    return chat_structured(messages, FollowUpQuestions, temperature=0.2)
