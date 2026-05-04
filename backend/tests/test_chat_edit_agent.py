"""Integration test for chat_edit agent loop.

Stubs the OpenAI client to return a scripted sequence of tool_calls then a
final assistant message. Verifies that:
- Edit tool calls accumulate into outcome.edits with correct field/value
- ask_user populates outcome.pending
- The loop terminates when the LLM returns no more tool_calls
"""
import json
from types import SimpleNamespace

import app.core.chat_edit as chat_edit_module
from app.core.chat_edit import chat_edit
from app.models.schemas import ChatEditRequest


def _fake_tool_call(name: str, args: dict, call_id: str = "t1"):
    return SimpleNamespace(
        id=call_id,
        function=SimpleNamespace(name=name, arguments=json.dumps(args)),
    )


def _fake_message(content: str = "", tool_calls=None):
    """Mimic the ChatCompletion message shape used by the agent loop."""
    msg = SimpleNamespace(
        content=content,
        tool_calls=tool_calls,
        # model_dump is called on the message to record into messages list
        model_dump=lambda: {
            "role": "assistant",
            "content": content,
            "tool_calls": [
                {"id": tc.id, "type": "function",
                 "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                for tc in (tool_calls or [])
            ] if tool_calls else None,
        },
    )
    return msg


class _FakeClient:
    def __init__(self, scripted_responses):
        self._responses = list(scripted_responses)
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **_kwargs):
        msg = self._responses.pop(0)
        return SimpleNamespace(choices=[SimpleNamespace(message=msg)])


def test_agent_accumulates_edits_and_pending(monkeypatch):
    # Script: round 1 → call update_subject + ask_user; round 2 → final text, no tool calls.
    round1 = _fake_message(
        content="",
        tool_calls=[
            _fake_tool_call("update_subject", {"text": "為辦理「ABC案」採購事宜，簽請核示。"}),
            _fake_tool_call("ask_user", {"question": "請問召集人？", "options": ["副處長", "其他"]}, call_id="t2"),
        ],
    )
    round2 = _fake_message(content="已起草第一版草稿。", tool_calls=None)

    import app.core.llm as llm_module
    monkeypatch.setattr(llm_module, "_client", _FakeClient([round1, round2]))
    # Reset the in-memory conversation store so we get a fresh session
    monkeypatch.setattr(chat_edit_module, "_conversations", {})

    req = ChatEditRequest(
        intent={"sender": "本處", "receiver": "本處"},
        doc_type="簽",
        subtype="一般簽",
        chat_history=[],
        user_message="ABC 系統採購簽",
    )
    outcome, sid = chat_edit(req)

    # Edits captured from update_subject
    assert any(e["field"] == "subject_detail" for e in outcome.edits)
    subject_edit = next(e for e in outcome.edits if e["field"] == "subject_detail")
    assert subject_edit["value"] == "為辦理「ABC案」採購事宜，簽請核示。"

    # ask_user surfaced as pending
    assert outcome.pending is not None
    assert outcome.pending["question"] == "請問召集人？"
    assert outcome.pending["options"] == ["副處長", "其他"]

    # Final assistant text from round 2
    assert outcome.assistant_message == "已起草第一版草稿。"

    # Session created
    assert sid
    assert sid in chat_edit_module._conversations


def test_agent_returns_natural_text_when_no_tool_calls(monkeypatch):
    """Pure conversational reply (no edits) — agent decides not to act."""
    only_text = _fake_message(content="請問是否要我直接起草？", tool_calls=None)
    import app.core.llm as llm_module
    monkeypatch.setattr(llm_module, "_client", _FakeClient([only_text]))
    monkeypatch.setattr(chat_edit_module, "_conversations", {})

    req = ChatEditRequest(
        intent={},
        doc_type="函",
        chat_history=[],
        user_message="hello",
    )
    outcome, _ = chat_edit(req)

    assert outcome.edits == []
    assert outcome.pending is None
    assert outcome.assistant_message == "請問是否要我直接起草？"
