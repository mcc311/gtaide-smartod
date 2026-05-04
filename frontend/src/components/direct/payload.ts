import type { IntentResult, GenerateRequest, PhraseResult, DocType } from "@/types"
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
  console.warn(
    `[applyEditToState] Unsupported edit: field=${edit.field} kind=${kind ?? "<unknown>"} valueType=${Array.isArray(edit.value) ? "array" : typeof edit.value}`,
  )
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
  chatHistory: Array<{ role: string; content: string }> = state.chatHistory,
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
    chat_history: chatHistory,
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

// ---------------------------------------------------------------------------
// I2: Cited-law aggregation
// ---------------------------------------------------------------------------

export interface CitedLawSuggestion {
  law_name: string
  category: string
  article_count: number
  articles: { no: string; content: string }[]
}

interface RagDoc {
  cited_laws?: { law_name: string; article_no: string }[]
}

/**
 * Normalize an article reference to its 第N條 prefix so 「第N條」and「第N條第M項」
 * group together. Used to keep doc-frequency counts stable across granularity.
 */
function normalizeArticleNo(articleNo: string): string {
  // Match leading 第N條 (with optional 之N), drop the rest
  const m = articleNo.match(/^(第\s*\d+\s*條(?:之\d+)?)/)
  return m ? m[1].replace(/\s+/g, "") : articleNo
}

/**
 * Aggregate cited_laws across retrieved docs by doc-frequency, dedupe within
 * each doc, and exclude any law already present in the AI suggestions.
 *
 * Returns a list of CitedLawSuggestion sorted by descending doc count, capped at 5.
 */
export function aggregateCitedLawSuggestions(
  docs: RagDoc[],
  excludeLawNames: Set<string>,
): CitedLawSuggestion[] {
  type Entry = {
    law_name: string
    docCount: number
    articles: Map<string, number> // normalized article_no -> doc-frequency
  }
  const lawFreq = new Map<string, Entry>()

  for (const doc of docs) {
    const cited = Array.isArray(doc?.cited_laws) ? doc.cited_laws : []
    // Dedupe within this doc
    const seenLawsInDoc = new Set<string>()
    const seenArticlesInDoc = new Set<string>() // normalized "law|art" keys
    for (const c of cited) {
      if (!c?.law_name) continue
      if (excludeLawNames.has(c.law_name)) continue
      let entry = lawFreq.get(c.law_name)
      if (!entry) {
        entry = { law_name: c.law_name, docCount: 0, articles: new Map() }
        lawFreq.set(c.law_name, entry)
      }
      if (!seenLawsInDoc.has(c.law_name)) {
        entry.docCount += 1
        seenLawsInDoc.add(c.law_name)
      }
      const normArt = normalizeArticleNo(c.article_no || "")
      if (!normArt) continue
      const artKey = `${c.law_name}|${normArt}`
      if (!seenArticlesInDoc.has(artKey)) {
        entry.articles.set(normArt, (entry.articles.get(normArt) ?? 0) + 1)
        seenArticlesInDoc.add(artKey)
      }
    }
  }

  return Array.from(lawFreq.values())
    .sort((a, b) => b.docCount - a.docCount)
    .slice(0, 5)
    .map((e) => ({
      law_name: e.law_name,
      category: `相似公文常用（${e.docCount} 篇引用）`,
      article_count: e.articles.size,
      articles: Array.from(e.articles.keys())
        .sort((a, b) => (e.articles.get(b) ?? 0) - (e.articles.get(a) ?? 0))
        .slice(0, 5)
        .map((no) => ({ no, content: "" })),
    }))
}

// ---------------------------------------------------------------------------
// I6: Synthetic state helper
// ---------------------------------------------------------------------------

/**
 * Build a synthetic DirectDocState for the very first chat-edit call in onboarding.
 * Real React state hasn't updated synchronously yet at that point, so we manually
 * thread freshly-parsed values through. Keeping this as a single helper means
 * adding a new field to DirectDocState requires updating one spot, not two.
 */
export function makeSyntheticInitialState(args: {
  docType: DocType
  phrases: PhraseResult | null
  ragExamples: string[]
  intent: IntentResult
  fieldKinds: FieldKinds
}): DirectDocState {
  return {
    phase: "clarifying",
    intent: args.intent,
    intentOverrides: {},
    docType: args.docType,
    phrases: args.phrases,
    chatHistory: [],
    chatSessionId: null,
    clarifyQuestions: [],
    answers: {},
    ragExamples: args.ragExamples,
    lawSuggestions: [],
    selectedLaws: [],
    fieldKinds: args.fieldKinds,
    subject_detail: "",
    explanation_items: [],
    action_items: [],
    citations: [],
    doc_date: "",
    doc_number: "",
    speed: "普通件",
    attachments: args.intent.attachments ?? [],
    recipients_main: [],
    recipients_cc: [],
    meeting_time: "",
    meeting_place: "",
    meeting_chair: "",
    meeting_contact: "",
    meeting_contact_phone: "",
    meeting_attendees: [],
    meeting_observers: [],
    meeting_notes: "",
    recentChange: null,
  }
}
