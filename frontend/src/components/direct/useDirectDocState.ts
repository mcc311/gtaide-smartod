import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import type { IntentResult, PhraseResult, DocType, OrganNode } from "@/types"
import type { DirectDocState, Phase, ClarifyQuestion, SelectedLaw, ChatMessage, FieldKinds } from "./directTypes"
import { toChatEditPayload, applyEditToState, aggregateCitedLawSuggestions, makeSyntheticInitialState, type Edit } from "./payload"
import type { OrganSelectInfo } from "@/components/OrganSelector"

function findOrganPath(
  name: string,
  nodes: OrganNode[],
  trail: string[] = []
): { path: string; level: number } | null {
  for (const n of nodes) {
    const currentTrail = [...trail, n.name]
    if (n.name === name) {
      return {
        path: currentTrail.slice(0, -1).join(" > "), // parent path (without self)
        level: n.level ?? currentTrail.length - 1,
      }
    }
    if (n.children.length > 0) {
      const found = findOrganPath(name, n.children, currentTrail)
      if (found) return found
    }
  }
  return null
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

const initialState: DirectDocState = {
  phase: "onboarding",
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
  subject_detail: "",
  explanation_items: [],
  action_items: [],
  citations: [],
  doc_date: isoToday(),
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
  fieldKinds: {},
  suggestedFollowups: [],
}

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

function phrasesToDict(phrases: PhraseResult | null): Record<string, string> {
  if (!phrases?.phrases) return {}
  return Object.fromEntries(
    Object.entries(phrases.phrases).map(([k, v]) => [k, String(v)])
  )
}

export function useDirectDocState() {
  const [state, setState] = useState<DirectDocState>(() => ({
    ...initialState,
    doc_date: isoToday(),
  }))
  const [history, setHistory] = useState<DirectDocState[]>([])
  const [organTree, setOrganTree] = useState<OrganNode[]>([])

  useEffect(() => {
    fetch("/api/organs", { credentials: "include" })
      .then((r) => r.json())
      .then((data: OrganNode[]) => setOrganTree(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/edit-tool-catalog", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { field_kinds: FieldKinds }) => {
        setState((s) => ({ ...s, fieldKinds: data.field_kinds }))
      })
      .catch(() => {})
  }, [])

  const flash = useCallback((key: string) => {
    setState((s) => ({ ...s, recentChange: key }))
    setTimeout(() => {
      setState((s) => (s.recentChange === key ? { ...s, recentChange: null } : s))
    }, 800)
  }, [])

  const update = useCallback(
    (patch: Partial<DirectDocState>, flashKey?: string) => {
      setState((prev) => {
        setHistory((h) => [...h.slice(-19), prev])
        return { ...prev, ...patch }
      })
      if (flashKey) flash(flashKey)
    },
    [flash]
  )

  const overrideIntent = useCallback(
    (patch: Partial<IntentResult>, flashKey?: string) => {
      setState((prev) => {
        setHistory((h) => [...h.slice(-19), prev])
        return {
          ...prev,
          intentOverrides: { ...prev.intentOverrides, ...patch },
        }
      })
      if (flashKey) flash(flashKey)
    },
    [flash]
  )

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setState(prev)
      return h.slice(0, -1)
    })
  }, [])

  const reset = useCallback(() => {
    setState({ ...initialState, doc_date: isoToday() })
    setHistory([])
  }, [])

  const setPhase = useCallback(
    (phase: Phase) => setState((s) => ({ ...s, phase })),
    []
  )

  const appendChat = useCallback((msg: ChatMessage) => {
    setState((s) => ({ ...s, chatHistory: [...s.chatHistory, msg] }))
  }, [])

  const _runGeneration = useCallback(
    async (
      intentForApi: IntentResult,
      phrasesForApi: Record<string, string>,
      answers: Record<string, string>,
      previousQuestions: ClarifyQuestion[],
      ragExamples: string[],
      selectedLaws: SelectedLaw[],
      docType: DocType,
      direction: string
    ) => {
      setState((s) => ({ ...s, phase: "generating" }))
      try {
        const res = await fetch("/api/generate-with-answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            intent: intentToDict(intentForApi),
            phrases: phrasesForApi,
            doc_type: docType,
            direction,
            answers,
            previous_questions: previousQuestions,
            rag_examples: ragExamples,
            selected_laws: selectedLaws.map((l) => ({
              law_name: l.law_name,
              articles: l.articles
                .filter((a) => a.checked)
                .map((a) => `${a.no}：${a.content}`),
            })),
          }),
        })
        if (!res.ok) throw new Error(`generate-with-answers failed: ${res.status}`)
        const data = await res.json()
        setState((s) => ({
          ...s,
          subject_detail: data.subject_detail ?? "",
          explanation_items: data.explanation_items ?? [],
          action_items: data.action_items ?? [],
          citations: data.citations ?? [],
          phase: "ready",
        }))
      } catch (err) {
        console.error(err)
        setState((s) => ({ ...s, phase: "ready" }))
      }
    },
    []
  )

  const onSubmitOnboarding = useCallback(
    async (text: string, senderInfo?: OrganSelectInfo): Promise<void> => {
      if (!text.trim()) return
      setState((s) => ({ ...s, phase: "parsing" }))
      try {
        const parseRes = await fetch("/api/parse-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            user_input: text,
            known_sender: senderInfo?.name ?? "",
            known_sender_parent: senderInfo?.parentContext ?? "",
          }),
        })
        if (!parseRes.ok) throw new Error("parse-intent failed")
        const parsed = await parseRes.json()

        // parse-intent's action_type is deprecated and may be ""; derive from doc_type when empty
        const inferredDocType: DocType = parsed.doc_type ?? "函"
        const derivedActionType: IntentResult["action_type"] =
          inferredDocType === "令"
            ? "公布法令"
            : inferredDocType === "開會通知單"
              ? "會議通知"
              : inferredDocType === "簽"
                ? "報告"
                : "新案"

        // senderInfo (from onboarding picker) is authoritative — use it when available
        const finalSender = parsed.sender || senderInfo?.name || ""
        const finalSenderLevel = senderInfo?.level ?? 0
        const finalSenderParent = senderInfo?.parentContext ?? ""

        // Fallback: look up from organ tree when senderInfo not provided
        const senderInfoFromTree = parsed.sender && !senderInfo
          ? findOrganPath(parsed.sender, organTree)
          : null

        const receiverInfo = parsed.receiver
          ? findOrganPath(parsed.receiver, organTree)
          : null

        // For internal doc types with empty receiver, default receiver to sender agency
        const inferredReceiver = parsed.receiver || (
          (parsed.doc_type === "簽" || parsed.doc_type === "便簽") && senderInfo
            ? senderInfo.name
            : ""
        )

        const intent: IntentResult = {
          sender: finalSender,
          receiver: inferredReceiver,
          receiver_type: parsed.receiver_type ?? "政府機關",
          is_internal: !!parsed.is_internal,
          action_type:
            (parsed.action_type as IntentResult["action_type"]) || derivedActionType,
          purpose: parsed.purpose ?? "",
          subject_brief: parsed.subject_brief ?? "",
          reference_doc: parsed.reference_doc || undefined,
          attachments: parsed.attachments ?? [],
          formality: parsed.formality ?? "正式",
          sender_level: senderInfo?.level ?? senderInfoFromTree?.level ?? finalSenderLevel,
          receiver_level: receiverInfo?.level ?? 0,
          sender_parent: senderInfo?.parentContext ?? senderInfoFromTree?.path ?? finalSenderParent,
          receiver_parent: receiverInfo?.path ?? "",
          receiver_display_name: parsed.receiver_display_name ?? "",
          subtype: parsed.subtype ?? "",
          confident: parsed.confident,
          reasoning: parsed.reasoning,
        }
        const docType: DocType = inferredDocType

        setState((s) => ({ ...s, intent, docType, phase: "clarifying" }))

        const senderDisplay = intent.sender_parent
          ? `${intent.sender_parent} > ${intent.sender}`
          : intent.sender || "（未知機關）"
        const receiverDisplay = intent.receiver_parent
          ? `${intent.receiver_parent} > ${intent.receiver}`
          : intent.receiver || "（未知對象）"
        const userMsg: ChatMessage = { role: "user", content: text }
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: `已解析：發文機關 ${senderDisplay}；受文者 ${receiverDisplay}；公文類型「${docType}${intent.subtype ? "・" + intent.subtype : ""}」。AI 將起草初版（不確定處以 ○○○ 標記），稍後會詢問需要補充的項目。`,
        }
        setState((s) => ({ ...s, chatHistory: [...s.chatHistory, userMsg, assistantMsg] }))

        const phrasesPromise = fetch("/api/get-phrases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sender: intent.sender,
            receiver: intent.receiver,
            action_type: intent.action_type,
            receiver_type: intent.receiver_type,
            sender_level: intent.sender_level,
            receiver_level: intent.receiver_level,
            sender_parent: intent.sender_parent,
            receiver_parent: intent.receiver_parent,
            subtype: intent.subtype,
          }),
        }).then((r) => (r.ok ? (r.json() as Promise<PhraseResult>) : null))

        const suggestPromise = fetch("/api/suggest-laws", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            intent: intentToDict(intent),
            doc_type: docType,
            subtype: intent.subtype,
          }),
        }).then((r) => (r.ok ? r.json() : { suggestions: [] }))

        const ragQuery = [intent.subject_brief, intent.subtype].filter(Boolean).join(" ")
        const ragPromise = ragQuery
          ? fetch("/api/retrieve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                query: ragQuery,
                doc_type: docType,
                subtype: intent.subtype,
                top_k: 3,
              }),
            }).then((r) => (r.ok ? r.json() : { documents: [], examples: [] }))
          : Promise.resolve({ documents: [], examples: [] })

        const [phrases, sugg, ragResp] = await Promise.all([phrasesPromise, suggestPromise, ragPromise])

        const ragExamples: string[] = Array.isArray(ragResp?.examples) ? ragResp.examples : []

        // Aggregate cited_laws across the retrieved similar docs by frequency.
        const aiSuggestions = Array.isArray(sugg.suggestions) ? sugg.suggestions : []
        const aiSuggestedNames = new Set<string>(
          aiSuggestions.map((s: { law_name: string }) => s.law_name)
        )
        const ragSuggestions = aggregateCitedLawSuggestions(
          Array.isArray(ragResp?.documents) ? ragResp.documents : [],
          aiSuggestedNames,
        )

        setState((s) => ({
          ...s,
          phrases,
          lawSuggestions: [...aiSuggestions, ...ragSuggestions],
          ragExamples,
        }))

        // First agent turn: let the LLM decide whether to ask or draft.
        // Use locally-scoped values (intent, phrases, sugg, docType) — not state — to avoid
        // stale closures from setState calls earlier in this function.
        // Flip to "generating" so PlaceholderBlock shows the loading animation while
        // the first draft is in flight (response handler resets it to "ready").
        setState((s) => ({ ...s, phase: "generating" }))
        try {
          const chatRes = await fetch("/api/chat-edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(
              toChatEditPayload(
                makeSyntheticInitialState({
                  docType,
                  phrases,
                  ragExamples,
                  intent,
                  fieldKinds: state.fieldKinds,
                }),
                intent,
                // Pass the user's original sentence as user_message (not as chat_history)
                // so the agent treats it as the active request — without it the agent goes
                // into "kickoff mode" and ○○○-substitutes specific user-stated values.
                text,
                null,
                [],
              ),
            ),
          })
          if (!chatRes.ok) throw new Error(`chat-edit ${chatRes.status}`)
          const data: {
            edits: Edit[]
            assistant_message: string
            pending_question: { question: string; options?: string[] } | null
            session_id: string
            suggested_followups?: string[] | null
          } = await chatRes.json()

          const assistantContent = data.pending_question?.question ?? data.assistant_message ?? ""
          const assistantOptions = data.pending_question?.options
          const hasDraft =
            (data.edits ?? []).some((e) =>
              ["subject_detail", "explanation_items", "action_items"].includes(e.field)
            )

          setState((prev) => {
            const next: DirectDocState = {
              ...prev,
              chatSessionId: data.session_id,
              suggestedFollowups: data.suggested_followups ?? [],
            }
            for (const edit of data.edits ?? []) {
              const valid = applyEditToState(edit, prev.fieldKinds)
              if (valid) {
                ;(next as unknown as Record<string, unknown>)[valid.field] = valid.value
              }
            }
            if (assistantContent) {
              next.chatHistory = [
                ...next.chatHistory,
                { role: "assistant", content: assistantContent, options: assistantOptions },
              ]
            }
            // Always exit "generating" so PlaceholderBlock animation stops and chat
            // becomes interactive again. Draft → "ready"; ask-only → "clarifying".
            next.phase = hasDraft ? "ready" : "clarifying"
            return next
          })
        } catch (err) {
          console.error(err)
          setState((s) => ({
            ...s,
            phase: "clarifying",
            chatHistory: [
              ...s.chatHistory,
              { role: "assistant", content: "（錯誤：第一輪 AI 助理連線失敗，請重新整理頁面）" },
            ],
          }))
        }
      } catch (err) {
        console.error(err)
        setState((s) => ({ ...s, phase: "onboarding" }))
      }
    },
    [organTree]
  )

  const answerClarify = useCallback(
    (fieldKey: string, label: string) => {
      setState((s) => {
        const newAnswers = { ...s.answers, [fieldKey]: label }
        const merged: IntentResult | null = s.intent
          ? { ...s.intent, ...s.intentOverrides }
          : null
        const allAnswered =
          s.clarifyQuestions.length > 0 &&
          s.clarifyQuestions.every((q) => newAnswers[q.field_key])
        if (allAnswered && merged) {
          void _runGeneration(
            merged,
            phrasesToDict(s.phrases),
            newAnswers,
            s.clarifyQuestions,
            s.ragExamples,
            s.selectedLaws,
            s.docType,
            s.phrases?.direction ?? "平行文"
          )
        }
        return { ...s, answers: newAnswers }
      })
    },
    [_runGeneration]
  )

  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const regenerate = useCallback(async (): Promise<void> => {
    // Route through chat-edit so we use the same agent prompt that knows to
    // preserve user-stated specifics. Sending user_message directly (not via
    // chat_history) makes the agent treat it as the active turn.
    const s = stateRef.current
    if (!s.intent) return
    const userMsg: ChatMessage = {
      role: "user",
      content: "我選了新的法規，請保留我先前說過的具體值，重做主旨/說明/辦法並把法條引用進去。",
    }
    setState((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMsg],
      phase: "generating",
    }))
    const merged = { ...s.intent, ...s.intentOverrides }
    try {
      const res = await fetch("/api/chat-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          toChatEditPayload(s, merged, userMsg.content, s.chatSessionId, s.chatHistory)
        ),
      })
      if (!res.ok) throw new Error(`chat-edit ${res.status}`)
      const data: {
        edits: { field: string; value: string | string[] }[]
        assistant_message: string
        pending_question: { question: string; options?: string[] } | null
        session_id: string
        suggested_followups?: string[] | null
      } = await res.json()

      const assistantContent = data.pending_question?.question ?? data.assistant_message ?? ""
      const assistantOptions = data.pending_question?.options
      setState((prev) => {
        const next: DirectDocState = {
          ...prev,
          chatSessionId: data.session_id,
          phase: "ready",
          suggestedFollowups: data.suggested_followups ?? [],
        }
        for (const edit of data.edits ?? []) {
          const valid = applyEditToState(edit as Edit, prev.fieldKinds)
          if (valid) {
            ;(next as unknown as Record<string, unknown>)[valid.field] = valid.value
          }
        }
        if (assistantContent) {
          next.chatHistory = [
            ...next.chatHistory,
            { role: "assistant", content: assistantContent, options: assistantOptions },
          ]
        }
        return next
      })
    } catch (err) {
      console.error(err)
      setState((prev) => ({
        ...prev,
        phase: "ready",
        chatHistory: [
          ...prev.chatHistory,
          { role: "assistant", content: "（錯誤：重新生成失敗）" },
        ],
      }))
    }
  }, [])

  // Computed
  const mergedIntent = useMemo<IntentResult | null>(() => {
    if (!state.intent) return null
    return { ...state.intent, ...state.intentOverrides }
  }, [state.intent, state.intentOverrides])

  const unansweredRequired = useMemo(
    () => state.clarifyQuestions.filter((q) => !state.answers[q.field_key]),
    [state.clarifyQuestions, state.answers]
  )

  return {
    state,
    mergedIntent,
    unansweredRequired,
    canUndo: history.length > 0,
    organTree,
    update,
    overrideIntent,
    undo,
    reset,
    setPhase,
    onSubmitOnboarding,
    answerClarify,
    regenerate,
    appendChat,
  }
}

export type UseDirectDocStateReturn = ReturnType<typeof useDirectDocState>
