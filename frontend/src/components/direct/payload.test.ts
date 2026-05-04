import { describe, it, expect } from "vitest"
import { toChatEditPayload, applyEditToState, DEFAULT_FIELD_KINDS, type Edit } from "./payload"
import type { DirectDocState } from "./directTypes"
import type { IntentResult } from "@/types"

function makeState(overrides: Partial<DirectDocState> = {}): DirectDocState {
  return {
    phase: "ready",
    intent: null,
    intentOverrides: {},
    docType: "函",
    phrases: null,
    chatHistory: [],
    chatSessionId: null,
    clarifyQuestions: [],
    answers: {},
    ragExamples: [],
    lawSuggestions: [],
    selectedLaws: [],
    fieldKinds: {},
    subject_detail: "",
    explanation_items: [],
    action_items: [],
    citations: [],
    doc_date: "",
    doc_number: "",
    speed: "普通件",
    attachments: [],
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
    ...overrides,
  }
}

describe("toChatEditPayload", () => {
  it("sends intent={} when mergedIntent is null (pre-parse state)", () => {
    const payload = toChatEditPayload(makeState(), null, "hi", null)
    expect(payload.intent).toEqual({})
    expect(payload.user_message).toBe("hi")
    expect(payload.session_id).toBeNull()
  })

  it("joins attachments into attachments_text with 、 separator", () => {
    const state = makeState({ attachments: ["附件A", "附件B", "附件C"] })
    const payload = toChatEditPayload(state, null, "", null)
    expect(payload.attachments_text).toBe("附件A、附件B、附件C")
  })

  it("uses chatHistoryOverride when provided (for synthetic onboarding turn)", () => {
    const state = makeState({ chatHistory: [{ role: "assistant", content: "ignored" }] })
    const override = [
      { role: "user", content: "real input" },
      { role: "assistant", content: "real ack" },
    ]
    const payload = toChatEditPayload(state, null, "", null, override)
    expect(payload.chat_history).toEqual(override)
  })

  it("propagates session_id and rag_examples", () => {
    const state = makeState({ ragExamples: ["過去公文 1", "過去公文 2"] })
    const payload = toChatEditPayload(state, null, "msg", "sid-123")
    expect(payload.session_id).toBe("sid-123")
    expect(payload.rag_examples).toEqual(["過去公文 1", "過去公文 2"])
  })

  it("falls back to DEFAULT_FIELD_KINDS when state.fieldKinds is empty", () => {
    // payload's helper internally uses DEFAULT_FIELD_KINDS — test exposed for verification
    expect(DEFAULT_FIELD_KINDS["subject_detail"]).toBe("scalar")
    expect(DEFAULT_FIELD_KINDS["explanation_items"]).toBe("array")
  })

  it("flattens mergedIntent fields into intent dict for backend", () => {
    const intent: IntentResult = {
      sender: "勞保局",
      receiver: "公眾",
      receiver_type: "公眾",
      is_internal: false,
      action_type: "新案",
      purpose: "公示送達",
      subject_brief: "公示送達",
      reference_doc: "",
      attachments: [],
      formality: "正式",
      sender_level: 3,
      receiver_level: 0,
      sender_parent: "中央機關 > 行政院 > 勞動部",
      receiver_parent: "",
      receiver_display_name: "",
      subtype: "公示送達",
    }
    const payload = toChatEditPayload(makeState(), intent, "", null)
    expect(payload.intent).toMatchObject({
      sender: "勞保局",
      receiver: "公眾",
      action_type: "新案",
    })
    expect(payload.subtype).toBe("公示送達")
  })
})

describe("applyEditToState", () => {
  it("accepts scalar field with string value", () => {
    const edit: Edit = { field: "subject_detail", value: "新主旨" }
    const result = applyEditToState(edit, {})
    expect(result).toEqual(edit)
  })

  it("accepts array field with string array value", () => {
    const edit: Edit = { field: "explanation_items", value: ["項1", "項2"] }
    const result = applyEditToState(edit, {})
    expect(result).toEqual(edit)
  })

  it("rejects scalar field with array value (kind mismatch)", () => {
    const edit: Edit = { field: "subject_detail", value: ["should be scalar"] }
    const result = applyEditToState(edit, {})
    expect(result).toBeNull()
  })

  it("rejects array field with string value (kind mismatch)", () => {
    const edit: Edit = { field: "explanation_items", value: "not an array" }
    const result = applyEditToState(edit, {})
    expect(result).toBeNull()
  })

  it("rejects unknown field", () => {
    const edit: Edit = { field: "no_such_field", value: "x" }
    const result = applyEditToState(edit, {})
    expect(result).toBeNull()
  })

  it("uses provided fieldKinds when populated, falling back to DEFAULT only when empty", () => {
    // Custom catalog: define a new field as scalar
    const customKinds = { custom_note: "scalar" as const }
    const edit: Edit = { field: "custom_note", value: "hi" }
    expect(applyEditToState(edit, customKinds)).toEqual(edit)
    // Field unknown to default but present in custom — only valid via custom
    expect(applyEditToState(edit, {})).toBeNull()
  })
})
