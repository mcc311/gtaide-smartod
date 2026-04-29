import { useState, useCallback, useMemo } from "react"
import type { IntentResult, PhraseResult, DocType } from "@/types"
import type { DirectDocState, Phase, ClarifyQuestion, SelectedLaw } from "./directTypes"

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

const initialState: DirectDocState = {
  phase: "onboarding",
  intent: null,
  intentOverrides: {},
  docType: "函",
  phrases: null,
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
    async (text: string): Promise<void> => {
      if (!text.trim()) return
      setState((s) => ({ ...s, phase: "parsing" }))
      try {
        const parseRes = await fetch("/api/parse-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_input: text }),
        })
        if (!parseRes.ok) throw new Error("parse-intent failed")
        const parsed = await parseRes.json()

        const intent: IntentResult = {
          sender: parsed.sender ?? "",
          receiver: parsed.receiver ?? "",
          receiver_type: parsed.receiver_type ?? "政府機關",
          is_internal: !!parsed.is_internal,
          action_type: parsed.action_type ?? "新案",
          purpose: parsed.purpose ?? "",
          subject_brief: parsed.subject_brief ?? "",
          reference_doc: parsed.reference_doc || undefined,
          attachments: parsed.attachments ?? [],
          formality: parsed.formality ?? "正式",
          sender_level: 0,
          receiver_level: 0,
          sender_parent: "",
          receiver_parent: "",
          receiver_display_name: parsed.receiver_display_name ?? "",
          subtype: parsed.subtype ?? "",
          confident: parsed.confident,
          reasoning: parsed.reasoning,
        }
        const docType: DocType = parsed.doc_type ?? "函"

        setState((s) => ({ ...s, intent, docType, phase: "clarifying" }))

        const phrasesPromise = fetch("/api/get-phrases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          body: JSON.stringify({
            intent: intentToDict(intent),
            doc_type: docType,
            subtype: intent.subtype,
          }),
        }).then((r) => (r.ok ? r.json() : { suggestions: [] }))

        const [phrases, sugg] = await Promise.all([phrasesPromise, suggestPromise])

        setState((s) => ({
          ...s,
          phrases,
          lawSuggestions: sugg.suggestions ?? [],
        }))

        const clarifyRes = await fetch("/api/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: intentToDict(intent),
            phrases: phrasesToDict(phrases),
            doc_type: docType,
            direction: phrases?.direction ?? "平行文",
            subtype: intent.subtype,
          }),
        })
        const clarifyData = clarifyRes.ok
          ? await clarifyRes.json()
          : { questions: [], rag_examples: [] }

        setState((s) => ({
          ...s,
          clarifyQuestions: clarifyData.questions ?? [],
          ragExamples: clarifyData.rag_examples ?? [],
        }))
      } catch (err) {
        console.error(err)
        setState((s) => ({ ...s, phase: "onboarding" }))
      }
    },
    []
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

  const regenerate = useCallback(async (): Promise<void> => {
    if (!state.intent) return
    const merged = { ...state.intent, ...state.intentOverrides }
    await _runGeneration(
      merged,
      phrasesToDict(state.phrases),
      state.answers,
      state.clarifyQuestions,
      state.ragExamples,
      state.selectedLaws,
      state.docType,
      state.phrases?.direction ?? "平行文"
    )
  }, [state, _runGeneration])

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
    update,
    overrideIntent,
    undo,
    reset,
    setPhase,
    onSubmitOnboarding,
    answerClarify,
    regenerate,
  }
}

export type UseDirectDocStateReturn = ReturnType<typeof useDirectDocState>
