"""Typed wrappers for the most drift-prone prompt templates.

Each class has an `Inputs` Pydantic model and a `render(inputs)` classmethod.
Call sites use these instead of bare `prompts.render(name, **kwargs)` to get
type checking on variable names.

Other simpler prompts (followup, clarify_user, content_user, intent_user, *_user)
continue to use `prompts.render()` directly.
"""

from pydantic import BaseModel

from app.core import prompts


class IntentSystemPrompt:
    """System prompt for intent_parser."""
    TEMPLATE = "intent_system.j2"

    class Inputs(BaseModel):
        organ_list: str

    @classmethod
    def render(cls, inputs: "IntentSystemPrompt.Inputs") -> str:
        return prompts.render(cls.TEMPLATE, **inputs.model_dump())


class GenerateSystemPrompt:
    """System prompt for /generate-with-answers (clarifier::generate_with_answers)."""
    TEMPLATE = "generate_system.j2"

    class Inputs(BaseModel):
        pass  # generate_system.j2 uses no template variables

    @classmethod
    def render(cls, inputs: "GenerateSystemPrompt.Inputs") -> str:
        return prompts.render(cls.TEMPLATE, **inputs.model_dump())


class ChatEditSystemPrompt:
    """System prompt for /chat-edit (the unified agent)."""
    TEMPLATE = "chat_edit_system.j2"

    class Inputs(BaseModel):
        intent: dict
        phrases: dict = {}
        doc_type: str
        direction: str = "平行文"
        subtype: str = ""
        subject_detail: str = ""
        explanation_items: list[str] = []
        action_items: list[str] = []
        doc_date: str = ""
        doc_number: str = ""
        speed: str = "普通件"
        attachments_text: str = ""
        recipients_main: list[str] = []
        recipients_cc: list[str] = []
        meeting_time: str = ""
        meeting_place: str = ""
        meeting_chair: str = ""
        meeting_contact: str = ""
        meeting_contact_phone: str = ""
        meeting_notes: str = ""
        rag_examples: list[str] = []

        model_config = {"arbitrary_types_allowed": True}

    @classmethod
    def render(cls, inputs: "ChatEditSystemPrompt.Inputs") -> str:
        return prompts.render(cls.TEMPLATE, **inputs.model_dump())
