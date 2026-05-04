import type { IntentResult, GenerateRequest } from "@/types"
import type { DirectDocState, FieldKinds } from "./directTypes"

export const DEFAULT_FIELD_KINDS: FieldKinds = {
  subject_detail: "scalar",
  explanation_items: "array",
  action_items: "array",
  recipients_main: "array",
  recipients_cc: "array",
  doc_date: "scalar",
  doc_number: "scalar",
  speed: "scalar",
  attachments_text: "scalar",
  meeting_time: "scalar",
  meeting_place: "scalar",
  meeting_chair: "scalar",
  meeting_contact: "scalar",
  meeting_contact_phone: "scalar",
  meeting_notes: "scalar",
}

export interface Edit {
  field: string
  value: string | string[]
}

export function applyEditToState(
  edit: Edit,
  fieldKinds: FieldKinds,
): { field: string; value: string | string[] } | null {
  const kinds = Object.keys(fieldKinds).length > 0 ? fieldKinds : DEFAULT_FIELD_KINDS
  const kind = kinds[edit.field]
  if (kind === "scalar" && typeof edit.value === "string") return edit
  if (kind === "array" && Array.isArray(edit.value)) return edit
  return null
}

/**
 * Convert IntentResult to the dict shape expected by the backend's
 * /api/chat-edit and /api/generate-with-answers endpoints.
 */
function intentToDict(intent: IntentResult): Record<string, unknown> {
  return {
    sender: intent.sender,
    receiver: intent.receiver,
    receiver_type: intent.receiver_type,
    action_type: intent.action_type,
    purpose: intent.purpose,
    subject_brief: intent.subject_brief,
    reference_doc: intent.reference_doc ?? "",
    attachments: intent.attachments,
    receiver_display_name: intent.receiver_display_name,
  }
}

/**
 * Build the body for POST /api/chat-edit.
 * `mergedIntent` may be null pre-parse; in that case intent is sent as {}.
 */
export function toChatEditPayload(
  state: DirectDocState,
  mergedIntent: IntentResult | null,
  userMessage: string,
  sessionId: string | null,
  // Optional: override chat_history (used by onSubmitOnboarding's first-turn synthetic history).
  chatHistoryOverride?: Array<{ role: string; content: string }>,
) {
  return {
    session_id: sessionId,
    intent: mergedIntent ? intentToDict(mergedIntent) : {},
    phrases: state.phrases?.phrases ?? {},
    rag_examples: state.ragExamples,
    doc_type: state.docType,
    direction: state.phrases?.direction ?? "平行文",
    subtype: mergedIntent?.subtype ?? "",
    subject_detail: state.subject_detail,
    explanation_items: state.explanation_items,
    action_items: state.action_items,
    doc_date: state.doc_date,
    doc_number: state.doc_number,
    speed: state.speed,
    attachments_text: state.attachments.join("、"),
    recipients_main: state.recipients_main,
    recipients_cc: state.recipients_cc,
    meeting_time: state.meeting_time,
    meeting_place: state.meeting_place,
    meeting_chair: state.meeting_chair,
    meeting_contact: state.meeting_contact,
    meeting_contact_phone: state.meeting_contact_phone,
    meeting_attendees: state.meeting_attendees,
    meeting_observers: state.meeting_observers,
    meeting_notes: state.meeting_notes,
    chat_history: chatHistoryOverride ?? state.chatHistory,
    user_message: userMessage,
  }
}

/**
 * Build the GenerateRequest payload for the export modal (uses /api/generate
 * via Step4Preview). Returns null if pre-parse (no merged intent yet).
 */
export function toGenerateRequest(
  state: DirectDocState,
  mergedIntent: IntentResult | null,
): { intent: IntentResult; form: GenerateRequest } | null {
  if (!mergedIntent) return null
  const form: GenerateRequest = {
    intent: mergedIntent,
    subject_detail: state.subject_detail,
    explanation_items: state.explanation_items,
    action_items: state.action_items,
    recipients_main: state.recipients_main,
    recipients_cc: state.recipients_cc,
    doc_date: state.doc_date,
    doc_number: state.doc_number,
    speed: state.speed,
    attachments_text: state.attachments.join("、"),
    meeting_time: state.meeting_time || undefined,
    meeting_place: state.meeting_place || undefined,
    meeting_chair: state.meeting_chair || undefined,
    meeting_contact: state.meeting_contact || undefined,
    meeting_contact_phone: state.meeting_contact_phone || undefined,
    meeting_attendees: state.meeting_attendees.length ? state.meeting_attendees : undefined,
    meeting_observers: state.meeting_observers.length ? state.meeting_observers : undefined,
    meeting_notes: state.meeting_notes || undefined,
  }
  return { intent: mergedIntent, form }
}
