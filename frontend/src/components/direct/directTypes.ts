import type { IntentResult, PhraseResult, DocType } from "@/types"

export type Phase = "onboarding" | "parsing" | "clarifying" | "generating" | "ready"

export interface ClarifyOption {
  label: string
  description: string
}

export interface ClarifyQuestion {
  question: string
  header: string
  field_key: string
  options: ClarifyOption[]
}

export interface LawArticleSummary {
  no: string
  content: string
}

export interface LawSuggestion {
  law_name: string
  category?: string
  article_count?: number
  articles: LawArticleSummary[]
}

export interface CheckedArticle extends LawArticleSummary {
  checked: boolean
}

export interface SelectedLaw {
  law_name: string
  articles: CheckedArticle[]
}

export interface Citation {
  law_name: string
  article_no: string
  valid: boolean
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  options?: string[]  // quick-reply shortcuts on assistant questions; user can also type freely
}

export interface DirectDocState {
  phase: Phase
  intent: IntentResult | null
  intentOverrides: Partial<IntentResult>
  docType: DocType
  phrases: PhraseResult | null
  chatHistory: ChatMessage[]
  chatSessionId: string | null
  clarifyQuestions: ClarifyQuestion[]
  answers: Record<string, string>
  ragExamples: string[]
  lawSuggestions: LawSuggestion[]
  selectedLaws: SelectedLaw[]
  subject_detail: string
  explanation_items: string[]
  action_items: string[]
  citations: Citation[]
  doc_date: string
  doc_number: string
  speed: "最速件" | "速件" | "普通件"
  attachments: string[]
  recipients_main: string[]
  recipients_cc: string[]
  meeting_time: string
  meeting_place: string
  meeting_chair: string
  meeting_contact: string
  meeting_contact_phone: string
  meeting_attendees: string[]
  meeting_observers: string[]
  meeting_notes: string
  recentChange: string | null
}
