import { useState, useCallback, useMemo } from "react"
import type { IntentResult } from "@/types"
import type { DirectDocState, Phase } from "./directTypes"

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

  // Stubs filled in Task 5
  const onSubmitOnboarding = useCallback(async (_text: string): Promise<void> => {
    return
  }, [])
  const answerClarify = useCallback((_fieldKey: string, _label: string) => {
    return
  }, [])
  const regenerate = useCallback(async (): Promise<void> => {
    return
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
