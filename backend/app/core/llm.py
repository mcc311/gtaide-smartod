import json
import os

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MODEL = os.getenv("LLM_MODEL", "google/gemini-2.5-flash")

_client = OpenAI(
    base_url=OPENROUTER_BASE_URL,
    api_key=OPENROUTER_API_KEY,
)


def chat(messages: list[dict], temperature: float = 0.3, tools: list[dict] | None = None) -> str:
    """Send a chat request and return the assistant message content."""
    kwargs: dict = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
    }
    if tools:
        kwargs["tools"] = tools
    resp = _client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content or ""


def chat_with_tools(
    messages: list[dict],
    tools: list[dict],
    tool_handlers: dict,
    temperature: float = 0.3,
    max_rounds: int = 5,
) -> str:
    """Chat with tool calling loop. Returns final assistant message."""
    kwargs: dict = {
        "model": MODEL,
        "messages": list(messages),
        "temperature": temperature,
        "tools": tools,
    }

    for _ in range(max_rounds):
        resp = _client.chat.completions.create(**kwargs)
        msg = resp.choices[0].message

        if not msg.tool_calls:
            return msg.content or ""

        # Process tool calls
        kwargs["messages"].append(msg.model_dump())
        for tc in msg.tool_calls:
            fn_name = tc.function.name
            fn_args = json.loads(tc.function.arguments)
            handler = tool_handlers.get(fn_name)
            if handler:
                result = handler(**fn_args)
            else:
                result = f"Unknown tool: {fn_name}"
            kwargs["messages"].append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, ensure_ascii=False) if not isinstance(result, str) else result,
            })

    # Max rounds reached, return last content
    return kwargs["messages"][-1].get("content", "")


def chat_with_tools_then_structured[T: BaseModel](
    messages: list[dict],
    tools: list[dict],
    tool_handlers: dict,
    response_model: type[T],
    temperature: float = 0.3,
    max_rounds: int = 5,
) -> T:
    """Two-phase: tool calling first, then structured output.

    Phase 1: LLM uses tools (search_law, get_article, etc.)
    Phase 2: LLM produces structured JSON with the gathered info.
    """
    # Phase 1: Tool calling
    tool_messages = list(messages)
    for _ in range(max_rounds):
        resp = _client.chat.completions.create(
            model=MODEL,
            messages=tool_messages,
            temperature=temperature,
            tools=tools,
        )
        msg = resp.choices[0].message

        if not msg.tool_calls:
            # No more tools needed, msg.content has the analysis
            break

        tool_messages.append(msg.model_dump())
        for tc in msg.tool_calls:
            fn_name = tc.function.name
            fn_args = json.loads(tc.function.arguments)
            handler = tool_handlers.get(fn_name)
            result = handler(**fn_args) if handler else f"Unknown tool: {fn_name}"
            tool_messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, ensure_ascii=False) if not isinstance(result, str) else result,
            })

    # Phase 2: Structured output (no tools, just JSON)
    tool_messages.append({
        "role": "user",
        "content": "根據以上資訊和工具查詢結果，請輸出最終的結構化 JSON。",
    })

    return chat_structured(tool_messages, response_model, temperature=temperature)


def chat_structured[T: BaseModel](
    messages: list[dict],
    response_model: type[T],
    temperature: float = 0.1,
) -> T:
    """Send a chat request with JSON schema and parse response into a Pydantic model."""
    schema = response_model.model_json_schema()

    # Add instruction to return JSON
    system_msg = messages[0] if messages and messages[0]["role"] == "system" else None
    if system_msg:
        system_msg = dict(system_msg)
        system_msg["content"] += "\n\n你必須回傳符合以下 JSON Schema 的 JSON：\n" + json.dumps(schema, ensure_ascii=False, indent=2)
        messages = [system_msg] + messages[1:]

    try:
        resp = _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
            response_format={"type": "json_object"},
        )
    except Exception:
        # Fallback: some models don't support response_format
        resp = _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
        )

    raw = resp.choices[0].message.content or "{}"

    # Try to parse
    try:
        return response_model.model_validate_json(raw)
    except Exception:
        # Try to extract JSON from response
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            return response_model.model_validate_json(raw[start:end])
        raise
