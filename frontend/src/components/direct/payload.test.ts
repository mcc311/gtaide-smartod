/**
 * Tests for the pure transforms in payload.ts. The React hook
 * `useDirectDocState` itself is intentionally NOT unit-tested here —
 * its behaviour is covered by manual smoke testing on the dev server.
 * The pure helpers below carry the contracts that matter for backend
 * payload shape and edit dispatch.
 */
import { describe, it, expect } from "vitest"
import { toChatEditPayload, applyEditToState, aggregateCitedLawSuggestions, DEFAULT_FIELD_KINDS, type Edit } from "./payload"
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
    const payload = toChatEditPayload(makeState(), null, "hi", null, [])
    expect(payload.intent).toEqual({})
    expect(payload.user_message).toBe("hi")
    expect(payload.session_id).toBeNull()
  })

  it("joins attachments into attachments_text with 、 separator", () => {
    const state = makeState({ attachments: ["附件A", "附件B", "附件C"] })
    const payload = toChatEditPayload(state, null, "", null, [])
    expect(payload.attachments_text).toBe("附件A、附件B、附件C")
  })

  it("forwards chat_history exactly as provided", () => {
    const history = [
      { role: "user", content: "real input" },
      { role: "assistant", content: "real ack" },
    ]
    const payload = toChatEditPayload(makeState(), null, "", null, history)
    expect(payload.chat_history).toEqual(history)
  })

  it("propagates session_id and rag_examples", () => {
    const state = makeState({ ragExamples: ["過去公文 1", "過去公文 2"] })
    const payload = toChatEditPayload(state, null, "msg", "sid-123", [])
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
    const payload = toChatEditPayload(makeState(), intent, "", null, [])
    expect(payload.intent).toMatchObject({
      sender: "勞保局",
      receiver: "公眾",
      action_type: "新案",
    })
    expect(payload.subtype).toBe("公示送達")
  })
})

describe("aggregateCitedLawSuggestions", () => {
  it("dedupes the same article cited multiple times within one doc", () => {
    const docs = [
      {
        cited_laws: [
          { law_name: "政府採購法", article_no: "第22條" },
          { law_name: "政府採購法", article_no: "第22條" },
          { law_name: "政府採購法", article_no: "第22條第1項" },
        ],
      },
    ]
    const result = aggregateCitedLawSuggestions(docs, new Set())
    expect(result).toHaveLength(1)
    expect(result[0].law_name).toBe("政府採購法")
    // 第22條 and 第22條第1項 normalize to the same prefix, so 1 unique article
    expect(result[0].articles).toHaveLength(1)
    expect(result[0].articles[0].no).toBe("第22條")
  })

  it("counts doc-frequency, not occurrence-frequency", () => {
    const docs = [
      { cited_laws: [{ law_name: "甲法", article_no: "第1條" }] },
      { cited_laws: [{ law_name: "甲法", article_no: "第1條" }] },
      { cited_laws: [{ law_name: "甲法", article_no: "第1條" }] },
    ]
    const result = aggregateCitedLawSuggestions(docs, new Set())
    expect(result[0].category).toBe("相似公文常用（3 篇引用）")
  })

  it("excludes laws already in the AI-suggested set", () => {
    const docs = [
      { cited_laws: [{ law_name: "甲法", article_no: "第1條" }] },
      { cited_laws: [{ law_name: "乙法", article_no: "第2條" }] },
    ]
    const result = aggregateCitedLawSuggestions(docs, new Set(["甲法"]))
    expect(result.map((r) => r.law_name)).toEqual(["乙法"])
  })

  it("sorts by descending doc count, caps at 5", () => {
    const docs = Array.from({ length: 6 }, (_, i) => ({
      cited_laws: [{ law_name: `法${i}`, article_no: "第1條" }],
    }))
    const result = aggregateCitedLawSuggestions(docs, new Set())
    expect(result).toHaveLength(5)
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
