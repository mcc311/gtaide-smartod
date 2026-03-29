from fastapi import APIRouter

from app.models.schemas import (
    ActionType,
    Direction,
    DirectionRequest,
    DirectionResponse,
    DocType,
    GenerateRequest,
    GenerateResponse,
    PhrasesRequest,
    PhrasesResponse,
)
from app.core.organ_registry import (
    get_organ,
    get_direction,
    is_same_chain,
    is_internal,
    get_all_organ_names,
    get_organ_tree,
)
from app.core.rule_engine import select_phrases, select_opening, select_expectation
from app.core.templates import render_document
from app.core.validator import validate_document
from app.core.intent_parser import parse_intent
from app.core.law_search import suggest_laws, get_law_categories
from app.core.content_generator import generate_content
from app.core.clarifier import ask_clarification, generate_with_answers
from app.core.followup import generate_followup
from app.core.rag import retrieve, format_examples, load_index

router = APIRouter()


def _determine_doc_type(
    action_type: ActionType,
    is_internal_flag: bool,
    direction: Direction,
    receiver_type: str = "政府機關",
    formality: str = "正式",
) -> DocType:
    """Determine the appropriate document type from action type and context."""
    if receiver_type == "公眾":
        return DocType.ANNOUNCEMENT
    if action_type == ActionType.MEETING:
        return DocType.MEETING_NOTICE
    if action_type == ActionType.PUBLISH_LAW:
        return DocType.DECREE
    if action_type == ActionType.PERSONNEL:
        return DocType.DECREE

    # Internal documents use 簽 or 便簽, not 函
    if is_internal_flag:
        if formality == "正式" or direction == Direction.UPWARD:
            return DocType.MEMO      # 簽
        else:
            return DocType.NOTE      # 便簽

    # External documents
    if formality == "正式":
        return DocType.LETTER        # 函
    else:
        return DocType.INFORMAL_LETTER  # 書函


@router.post("/analyze-direction", response_model=DirectionResponse)
def analyze_direction(req: DirectionRequest):
    """Analyze the direction between sender and receiver organs."""
    direction = get_direction(req.sender, req.receiver, req.receiver_type,
                              req.sender_level, req.receiver_level)
    same_chain = is_same_chain(req.sender, req.receiver)
    internal = is_internal(req.sender, req.receiver,
                           req.sender_parent, req.receiver_parent)

    sender_organ = get_organ(req.sender)
    receiver_organ = get_organ(req.receiver)

    return DirectionResponse(
        direction=direction,
        is_same_chain=same_chain,
        is_internal=internal,
        sender_info=sender_organ.to_dict() if sender_organ else {"name": req.sender, "short_name": "機關", "level": req.sender_level, "parent": req.sender_parent, "chain": []},
        receiver_info=receiver_organ.to_dict() if receiver_organ else {"name": req.receiver, "short_name": "機關", "level": req.receiver_level, "parent": req.receiver_parent, "chain": []},
    )


@router.post("/get-phrases", response_model=PhrasesResponse)
def get_phrases(req: PhrasesRequest):
    """Get all formulaic phrases for a given sender/receiver/action combination."""
    direction = get_direction(req.sender, req.receiver, req.receiver_type,
                              req.sender_level, req.receiver_level)
    internal = is_internal(req.sender, req.receiver,
                           req.sender_parent, req.receiver_parent)
    phrases = select_phrases(direction, req.sender, req.receiver, req.action_type, req.receiver_type, internal, req.subtype)
    opening = select_opening(req.action_type, req.subtype)
    expectation = select_expectation(direction, req.action_type, internal, req.subtype)

    return PhrasesResponse(
        direction=direction,
        is_internal=internal,
        subtype=req.subtype,
        phrases=phrases,
        opening=opening,
        expectation=expectation,
    )


@router.post("/generate", response_model=GenerateResponse)
def generate_document(req: GenerateRequest):
    """Generate a full official document."""
    direction = get_direction(req.intent.sender, req.intent.receiver, req.intent.receiver_type,
                              req.intent.sender_level, req.intent.receiver_level)
    internal = is_internal(req.intent.sender, req.intent.receiver,
                           req.intent.sender_parent, req.intent.receiver_parent)

    # Use receiver_display_name for the actual document rendering
    if req.intent.receiver_display_name:
        display_name = req.intent.receiver_display_name
        if req.intent.receiver_type == "人民":
            display_name = f"{display_name} 君"
        # Override receiver for document rendering
        req.intent.receiver = display_name

    doc_type = _determine_doc_type(
        req.intent.action_type, internal, direction,
        req.intent.receiver_type, req.intent.formality,
    )
    subtype = req.intent.subtype or ""
    phrases = select_phrases(direction, req.intent.sender, req.intent.receiver, req.intent.action_type, req.intent.receiver_type, internal, subtype)

    rendered = render_document(doc_type, phrases, req)

    warnings = validate_document(
        doc_type=doc_type,
        direction=direction,
        phrases=phrases,
        rendered=rendered,
        subject_detail=req.subject_detail,
    )

    return GenerateResponse(
        doc_type=doc_type,
        direction=direction,
        subtype=subtype,
        rendered=rendered,
        phrases_used=phrases,
        validation_warnings=warnings,
    )


@router.post("/followup")
def api_followup(req: dict):
    """Generate follow-up questions based on user's initial input."""
    user_input = req.get("user_input", "")
    if not user_input:
        return {"error": "user_input is required"}

    # RAG: find similar docs for context
    rag_docs = retrieve(user_input, top_k=3)
    rag_examples = format_examples(rag_docs)

    result = generate_followup(user_input, rag_examples)
    return {"questions": result.questions}


@router.post("/parse-intent")
def api_parse_intent(req: dict):
    """Use LLM to parse natural language into structured intent.

    Accepts optional followup_questions and followup_answers for richer context.
    """
    user_input = req.get("user_input", "")
    if not user_input:
        return {"error": "user_input is required"}
    followup_questions = req.get("followup_questions", None)
    followup_answers = req.get("followup_answers", None)
    result = parse_intent(user_input, followup_questions, followup_answers)
    return result.model_dump()


@router.post("/generate-content")
def api_generate_content(req: dict):
    """Use LLM to generate document content fields."""
    intent = req.get("intent", {})
    phrases = req.get("phrases", {})
    doc_type = req.get("doc_type", "函")
    direction = req.get("direction", "平行文")
    is_internal_flag = req.get("is_internal", False)
    rag_examples = req.get("rag_examples", None)

    result = generate_content(
        intent=intent,
        phrases=phrases,
        doc_type=doc_type,
        direction=direction,
        is_internal=is_internal_flag,
        rag_examples=rag_examples,
    )
    return result.model_dump()


@router.post("/retrieve")
def api_retrieve(req: dict):
    """Retrieve similar documents from the NCHC corpus."""
    query = req.get("query", "")
    doc_type = req.get("doc_type", "")
    subtype = req.get("subtype", "")
    top_k = req.get("top_k", 5)

    docs = retrieve(query, doc_type=doc_type, subtype=subtype, top_k=top_k)
    examples = format_examples(docs)
    return {"documents": docs, "examples": examples}


@router.post("/clarify")
def api_clarify(req: dict):
    """Ask LLM to identify missing info and generate clarifying questions.
    Retrieves related docs from corpus and passes them as context.
    """
    intent = req.get("intent", {})
    phrases = req.get("phrases", {})
    doc_type = req.get("doc_type", "函")
    direction = req.get("direction", "平行文")

    subtype = req.get("subtype", intent.get("subtype", ""))

    # RAG: retrieve related documents
    query = f"{intent.get('purpose', '')} {intent.get('subject_brief', '')}"
    rag_docs = retrieve(query, doc_type=doc_type, subtype=subtype, top_k=3)
    rag_examples = format_examples(rag_docs)

    result = ask_clarification(intent, phrases, doc_type, direction, rag_examples)
    return {
        **result.model_dump(),
        "rag_examples": rag_examples,
    }


@router.post("/generate-with-answers")
def api_generate_with_answers(req: dict):
    """Generate content using intent + user's clarification answers.
    Uses same RAG examples passed from clarify step, or retrieves fresh ones.
    """
    intent = req.get("intent", {})
    phrases = req.get("phrases", {})
    doc_type = req.get("doc_type", "函")
    direction = req.get("direction", "平行文")
    answers = req.get("answers", {})
    previous_questions = req.get("previous_questions", None)
    rag_examples = req.get("rag_examples", None)

    subtype = req.get("subtype", intent.get("subtype", ""))

    # If no rag_examples passed from frontend, retrieve fresh
    if not rag_examples:
        query = f"{intent.get('purpose', '')} {intent.get('subject_brief', '')}"
        rag_docs = retrieve(query, doc_type=doc_type, subtype=subtype, top_k=3)
        rag_examples = format_examples(rag_docs)

    result, citations = generate_with_answers(
        intent=intent,
        phrases=phrases,
        doc_type=doc_type,
        direction=direction,
        answers=answers,
        previous_questions=previous_questions,
        rag_examples=rag_examples,
    )
    data = result.model_dump()
    data["citations"] = citations
    return data


@router.post("/suggest-laws")
def api_suggest_laws(req: dict):
    """Suggest relevant laws based on document intent."""
    intent = req.get("intent", {})
    doc_type = req.get("doc_type", "")
    subtype = req.get("subtype", intent.get("subtype", ""))
    return {
        "suggestions": suggest_laws(
            subject_brief=intent.get("subject_brief", intent.get("purpose", "")),
            doc_type=doc_type,
            subtype=subtype,
            organ=intent.get("sender", ""),
        )
    }


@router.get("/law-categories")
def api_law_categories():
    """Return law category tree for browsing."""
    return {"categories": get_law_categories()}


@router.get("/organs")
def list_organs():
    """Return organ tree for hierarchical selector."""
    return get_organ_tree()


@router.get("/organs/flat")
def list_organs_flat() -> list[str]:
    """Return flat organ names for search/autocomplete."""
    return get_all_organ_names()


@router.get("/doc-types")
def list_doc_types() -> list[dict]:
    """Return all document types with descriptions."""
    descriptions = {
        DocType.LETTER: "最常用公文，用於機關間正式行文",
        DocType.INFORMAL_LETTER: "較函略為簡便，用於一般聯繫",
        DocType.MEMO: "機關內部請示、建議用",
        DocType.NOTE: "機關內部簡便聯繫用",
        DocType.ANNOUNCEMENT: "對公眾發布事項",
        DocType.DECREE: "公布法令、人事命令",
        DocType.MEETING_NOTICE: "通知開會事宜",
    }
    return [
        {"value": dt.value, "description": descriptions.get(dt, "")}
        for dt in DocType
    ]


@router.get("/action-types")
def list_action_types() -> list[dict]:
    """Return all action types with descriptions."""
    descriptions = {
        ActionType.NEW_CASE: "全新案件行文",
        ActionType.REPLY: "回覆來函",
        ActionType.FORWARD: "轉知其他機關",
        ActionType.SEND_DOCS: "檢送文件資料",
        ActionType.MEETING: "開會通知",
        ActionType.PUBLISH_LAW: "公布法規命令",
        ActionType.PERSONNEL: "人事任免",
        ActionType.REPORT: "提報上級",
    }
    return [
        {"value": at.value, "description": descriptions.get(at, "")}
        for at in ActionType
    ]
