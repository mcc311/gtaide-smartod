# Direct-Edit Single-Page UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 6-step wizard with a single-page direct-edit UI where every field on a 公文紙 preview is inline-editable, while preserving the AI pipeline (parse-intent → suggest-laws / clarify → generate-with-answers).

**Architecture:** Two-column layout (canvas + AI panel) under a header and above a status bar. State lives in a single `useDirectDocState` hook. Existing `OrganSelector` and `Step3LawSuggestion` are remounted as modals. Backend endpoints unchanged. Mounted at `?direct=1` initially; cutover to default once stable.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind 4, Radix UI primitives, lucide-react icons, Vite. No test framework — verification via `pnpm build` (tsc + vite build), `pnpm lint`, and manual dev server smoke tests.

**Branch:** `design/single-page-preview` (already created). All work commits to this branch.

---

## Conventions for every task

- **Type-check before each commit:** `pnpm --dir frontend build` (runs `tsc -b && vite build`). Must pass cleanly.
- **Lint after edits:** `pnpm --dir frontend lint`. Address new warnings.
- **Manual smoke test after every UI-affecting task:** start dev server (`pnpm --dir frontend dev`), navigate to `http://localhost:5173/?direct=1`, verify the named acceptance criterion. The legacy wizard at `/` must remain functional throughout.
- **Commit message style:** match existing (`feat: ...`, `fix: ...`, scope optional). One commit per task.
- **Never edit backend files** — every endpoint already exists with the contract noted in the task that consumes it.

---

## File structure

All new files in `frontend/src/components/direct/`:

| File | Responsibility |
| --- | --- |
| `useDirectDocState.ts` | Single state hook: doc state, history, pipeline orchestration, action dispatchers |
| `directTypes.ts` | TS types specific to this UI: `ClarifyQuestion`, `LawSuggestion`, `SelectedLaw`, `DirectDocState`, `Phase` |
| `DirectEditPage.tsx` | Top-level: composes header + canvas + AI panel + bottom bar + modals |
| `OnboardingOverlay.tsx` | First-run sentence input + 3 example chips + "從空白開始" |
| `Header.tsx` | GTAIDE logo, title, undo/redo, restart, export buttons |
| `DocCanvas.tsx` | The 公文紙 preview (top stamp, chips, meta block, divider, sections, sign block) |
| `Editable.tsx` | Inline text editor primitive (click → input/textarea → blur commits) |
| `Pickable.tsx` | Inline dropdown primitive (doc_type / direction / speed) |
| `TagsInline.tsx` | Inline chip-list editor (附件) |
| `ListSection.tsx` | List editor for 說明 / 辦法 / 公告事項 |
| `PlaceholderBlock.tsx` | Dashed "待補充" block shown when section is empty pre-generation |
| `AiPanel.tsx` | Right-side panel shell: collapse + tabs |
| `AiTabSuggestions.tsx` | Clarify cards + post-draft improvement suggestions |
| `AiTabLaws.tsx` | Cited + AI-suggested laws + "+ 搜尋更多" trigger |
| `AiTabChat.tsx` | Text input + canned suggested questions (stub for v1) |
| `BottomStatusBar.tsx` | Completion %, warnings, metadata one-liner |
| `ExportModal.tsx` | Mounts existing `DocumentPreview` with current state mapped to `GenerateRequest` |

Edited:
- `frontend/src/App.tsx` — add `?direct=1` route to mount `DirectEditPage`. (Cutover later.)

Reused as-is (no edits unless noted):
- `frontend/src/components/OrganSelector.tsx` — already supports modal-via-popover; remounted by `DocCanvas` for sender/receiver clicks.
- `frontend/src/components/Step3LawSuggestion.tsx` — wrapped in a fullscreen modal in Task 16.
- `frontend/src/components/Step4Preview.tsx` (DocumentPreview) — embedded in Task 18 export modal.
- `frontend/src/components/ui/*` — all primitives.

---

## Task 1: Branch confirmation + folder skeleton

**Files:**
- Create: `frontend/src/components/direct/.gitkeep`

- [ ] **Step 1: Verify branch**

Run: `git branch --show-current`
Expected output: `design/single-page-preview`. If not, run `git checkout design/single-page-preview`.

- [ ] **Step 2: Create folder with placeholder**

Run: `mkdir -p frontend/src/components/direct && touch frontend/src/components/direct/.gitkeep`

- [ ] **Step 3: Verify build still passes (no behavior change)**

Run: `pnpm --dir frontend build`
Expected: completes successfully (no new files compiled yet).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/direct/.gitkeep
git commit -m "chore: scaffold direct/ folder for single-page UI"
```

---

## Task 2: Direct-UI type definitions

**Files:**
- Create: `frontend/src/components/direct/directTypes.ts`

- [ ] **Step 1: Write the type file**

```typescript
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

export interface DirectDocState {
  phase: Phase
  intent: IntentResult | null
  intentOverrides: Partial<IntentResult>
  docType: DocType
  phrases: PhraseResult | null
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
```

- [ ] **Step 2: Type-check**

Run: `pnpm --dir frontend build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/direct/directTypes.ts
git commit -m "feat: add direct-UI types (Phase, ClarifyQuestion, DirectDocState)"
```

---

## Task 3: State hook stub (no API calls yet)

**Files:**
- Create: `frontend/src/components/direct/useDirectDocState.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useState, useCallback, useMemo } from "react"
import type { IntentResult, PhraseResult, DocType } from "@/types"
import type {
  DirectDocState,
  Phase,
  ClarifyQuestion,
  SelectedLaw,
} from "./directTypes"

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
  const [state, setState] = useState<DirectDocState>(initialState)
  const [history, setHistory] = useState<DirectDocState[]>([])

  const flash = useCallback((key: string) => {
    setState((s) => ({ ...s, recentChange: key }))
    setTimeout(() => {
      setState((s) => (s.recentChange === key ? { ...s, recentChange: null } : s))
    }, 800)
  }, [])

  const update = useCallback(
    (patch: Partial<DirectDocState>, flashKey?: string) => {
      setHistory((h) => [...h.slice(-19), state])
      setState((prev) => ({ ...prev, ...patch }))
      if (flashKey) flash(flashKey)
    },
    [state, flash]
  )

  const overrideIntent = useCallback(
    (patch: Partial<IntentResult>, flashKey?: string) => {
      setHistory((h) => [...h.slice(-19), state])
      setState((prev) => ({
        ...prev,
        intentOverrides: { ...prev.intentOverrides, ...patch },
      }))
      if (flashKey) flash(flashKey)
    },
    [state, flash]
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
```

- [ ] **Step 2: Type-check**

Run: `pnpm --dir frontend build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/direct/useDirectDocState.ts
git commit -m "feat: add useDirectDocState hook with state shape and undo (no pipeline yet)"
```

---

## Task 4: Empty `DirectEditPage` + `?direct=1` route

**Files:**
- Create: `frontend/src/components/direct/DirectEditPage.tsx`
- Modify: `frontend/src/App.tsx` (add early-return for `?direct=1`)

- [ ] **Step 1: Write `DirectEditPage` placeholder**

```typescript
import { useDirectDocState } from "./useDirectDocState"

export default function DirectEditPage() {
  const { state } = useDirectDocState()

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F5F1EC]">
      <header className="border-b border-[#E1E1E1] bg-white shrink-0 px-4 lg:px-8 py-3">
        <div className="flex items-center gap-2.5">
          <img src="/gtaide_logo.svg" alt="GTAIDE" className="h-7" />
          <div className="hidden sm:block h-5 w-px bg-[#E1E1E1]" />
          <span className="hidden sm:inline text-base font-semibold text-[#1B2D6B]">
            SmartOD <span className="text-[#666] font-normal">· 直接編輯版</span>
          </span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">
        <section className="overflow-y-auto p-6 lg:p-10">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-[#E1E1E1] p-8 min-h-[600px]">
            <p className="text-sm text-[#999]">[DocCanvas placeholder] phase = {state.phase}</p>
          </div>
        </section>
        <aside className="hidden lg:block border-l border-[#E1E1E1] bg-white overflow-y-auto p-4">
          <p className="text-sm text-[#999]">[AiPanel placeholder]</p>
        </aside>
      </main>

      <footer className="border-t border-[#E1E1E1] bg-white shrink-0 px-4 py-2 text-xs text-[#999]">
        [BottomStatusBar placeholder]
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Mount it from `App.tsx` when `?direct=1`**

Edit `frontend/src/App.tsx`. Add this import at the top:

```typescript
import DirectEditPage from "@/components/direct/DirectEditPage"
```

Then immediately after the existing `import` block and before `function isoToday()`, add:

```typescript
function isDirectMode(): boolean {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).get("direct") === "1"
}
```

Inside `export default function App()`, as the first line of the function body (before `useState` calls), add:

```typescript
  if (isDirectMode()) return <DirectEditPage />
```

- [ ] **Step 3: Type-check**

Run: `pnpm --dir frontend build`
Expected: succeeds.

- [ ] **Step 4: Manual smoke test**

```bash
pnpm --dir frontend dev
```
Open `http://localhost:5173/?direct=1`. Expected: header with "SmartOD · 直接編輯版", a white card placeholder showing `phase = onboarding`, and right-side aside placeholder.
Open `http://localhost:5173/`. Expected: the existing 6-step wizard renders unchanged.
Stop dev server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/direct/DirectEditPage.tsx
git commit -m "feat: mount DirectEditPage at ?direct=1 (placeholder shell)"
```

---

## Task 5: Pipeline orchestration in the hook

**Files:**
- Modify: `frontend/src/components/direct/useDirectDocState.ts`

Backend endpoints used (request/response shapes verified in Phase 1 exploration):
- `POST /api/parse-intent` — body `{user_input, followup_questions?, followup_answers?}` → `ParsedIntentResponse`
- `POST /api/get-phrases` — body `{sender, receiver, doc_type, action_type, ...}` → `PhraseResult` (used to fetch phrases for backend consumption)
- `POST /api/suggest-laws` — body `{intent, doc_type, subtype}` → `{suggestions: LawSuggestion[]}`
- `POST /api/clarify` — body `{intent, phrases, doc_type, direction, subtype}` → `{questions, rag_examples, ...}`
- `POST /api/generate-with-answers` — body `{intent, phrases, doc_type, direction, answers, previous_questions, rag_examples, selected_laws}` → `{subject_detail, explanation_items, action_items, citations}`

- [ ] **Step 1: Replace stubs with real pipeline calls**

Edit `frontend/src/components/direct/useDirectDocState.ts`. Replace the three stub callbacks (`onSubmitOnboarding`, `answerClarify`, `regenerate`) with the implementations below. Add a helper `_buildIntentDict` and `_buildPhrasesDict` near the top of the hook body.

Replace the stubs:

```typescript
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
              articles: l.articles.filter((a) => a.checked).map((a) => a.no),
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

        // Parallel: phrases, suggest-laws, clarify
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
        }).then((r) => (r.ok ? r.json() : null))

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
        const clarifyData = clarifyRes.ok ? await clarifyRes.json() : { questions: [], rag_examples: [] }

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
```

Add these helpers above `useDirectDocState`:

```typescript
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
```

No other changes needed in this file — the existing `state` / `setState` / `update` etc. from Task 3 stay as-is.

- [ ] **Step 2: Type-check**

Run: `pnpm --dir frontend build`
Expected: succeeds. If TypeScript complains about `phrasesToDict` being called on `PhraseResult | null`, add a non-null cast as `phrasesToDict(s.phrases as never)` only if needed; ideally adjust the helper signature to accept `PhraseResult | null`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/direct/useDirectDocState.ts
git commit -m "feat: wire pipeline (parse-intent → clarify+suggest+phrases → generate-with-answers)"
```

---

## Task 6: `Editable.tsx` inline text editor

**Files:**
- Create: `frontend/src/components/direct/Editable.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface EditableProps {
  value: string
  placeholder?: string
  multiline?: boolean
  className?: string
  recent?: boolean
  onChange: (value: string) => void
}

export default function Editable({
  value,
  placeholder = "點此編輯...",
  multiline,
  className,
  recent,
  onChange,
}: EditableProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || "")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => setDraft(value || ""), [value])
  useEffect(() => {
    const el = multiline ? textareaRef.current : inputRef.current
    if (editing && el) {
      el.focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  }, [editing, multiline])

  const commit = () => {
    if (draft !== value) onChange(draft)
    setEditing(false)
  }
  const cancel = () => {
    setDraft(value || "")
    setEditing(false)
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          className={cn(
            "w-full bg-white border border-[#1B2D6B] rounded px-2 py-1 text-sm leading-relaxed focus:outline-none",
            className
          )}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel()
          }}
          rows={Math.max(2, draft.split("\n").length)}
        />
      )
    }
    return (
      <input
        ref={inputRef}
        className={cn(
          "bg-white border border-[#1B2D6B] rounded px-2 py-0.5 text-sm focus:outline-none",
          className
        )}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") cancel()
        }}
      />
    )
  }

  if (!value) {
    return (
      <button
        type="button"
        className={cn(
          "text-left text-[#999] italic hover:bg-[#F5F1EC] rounded px-1 py-0.5 transition-colors",
          className
        )}
        onClick={() => setEditing(true)}
      >
        {placeholder}
      </button>
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-text hover:bg-[#F5F1EC] rounded px-1 -mx-1 py-0.5 transition-colors",
        recent && "bg-[#FFF4E0]",
        className
      )}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setEditing(true)
      }}
    >
      {value}
    </span>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --dir frontend build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/direct/Editable.tsx
git commit -m "feat: add Editable inline text primitive"
```

---

## Task 7: `Pickable.tsx` inline dropdown

**Files:**
- Create: `frontend/src/components/direct/Pickable.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PickableProps {
  value: string
  options: string[]
  className?: string
  recent?: boolean
  onChange: (value: string) => void
}

export default function Pickable({ value, options, className, recent, onChange }: PickableProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded border border-transparent hover:border-[#E1E1E1] hover:bg-[#F5F1EC] transition-colors text-sm",
          recent && "bg-[#FFF4E0]",
          className
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {value}
        <ChevronDown className="h-3 w-3 text-[#999]" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 min-w-[120px] bg-white border border-[#E1E1E1] rounded-md shadow-lg py-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm hover:bg-[#F5F1EC]",
                opt === value && "text-[#1B2D6B] font-medium"
              )}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
            >
              <span>{opt}</span>
              {opt === value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm --dir frontend build
git add frontend/src/components/direct/Pickable.tsx
git commit -m "feat: add Pickable inline dropdown primitive"
```

---

## Task 8: `TagsInline.tsx` chip-list editor

**Files:**
- Create: `frontend/src/components/direct/TagsInline.tsx`

- [ ] **Step 1: Write the component**

```typescript
import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface TagsInlineProps {
  tags: string[]
  placeholder?: string
  onChange: (tags: string[]) => void
}

export default function TagsInline({ tags, placeholder = "+ 新增", onChange }: TagsInlineProps) {
  const [adding, setAdding] = useState(false)
  const [val, setVal] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const commit = () => {
    if (val.trim()) onChange([...tags, val.trim()])
    setVal("")
    setAdding(false)
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="inline-flex items-center gap-1 bg-[#F5F1EC] text-[#222] text-xs rounded-full px-2 py-0.5"
        >
          {t}
          <button
            type="button"
            className="hover:text-[#D5705D]"
            onClick={() => onChange(tags.filter((_, j) => j !== i))}
            aria-label="移除"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          ref={inputRef}
          className="text-xs border border-[#1B2D6B] rounded px-1.5 py-0.5 focus:outline-none w-24"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") {
              setVal("")
              setAdding(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="text-xs text-[#666] hover:text-[#1B2D6B] px-1.5 py-0.5"
          onClick={() => setAdding(true)}
        >
          {placeholder}
        </button>
      )}
    </span>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
pnpm --dir frontend build
git add frontend/src/components/direct/TagsInline.tsx
git commit -m "feat: add TagsInline chip-list editor"
```

---

## Task 9: `ListSection.tsx` + `PlaceholderBlock.tsx`

**Files:**
- Create: `frontend/src/components/direct/ListSection.tsx`
- Create: `frontend/src/components/direct/PlaceholderBlock.tsx`

- [ ] **Step 1: Write `PlaceholderBlock.tsx`**

```typescript
interface PlaceholderBlockProps {
  unansweredCount: number
}

export default function PlaceholderBlock({ unansweredCount }: PlaceholderBlockProps) {
  return (
    <div className="border-2 border-dashed border-[#E1E1E1] rounded-md px-4 py-6 text-center bg-[#FAF9F6]">
      <div className="text-sm text-[#999]">
        待補充
        {unansweredCount > 0 && (
          <span className="text-[#F5922A] font-medium">
            {" "}
            · 請於右側完成 {unansweredCount} 個釐清問題
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `ListSection.tsx`**

```typescript
import Editable from "./Editable"
import { Plus, Trash2 } from "lucide-react"

interface ListSectionProps {
  items: string[]
  placeholder: string
  onChange: (items: string[]) => void
}

export default function ListSection({ items, placeholder, onChange }: ListSectionProps) {
  const updateAt = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next)
  }
  const removeAt = (i: number) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, ""])

  if (items.length === 0) {
    return (
      <button
        type="button"
        className="text-left text-sm text-[#999] italic hover:bg-[#F5F1EC] rounded px-1 py-0.5"
        onClick={add}
      >
        {placeholder}
      </button>
    )
  }

  return (
    <ol className="space-y-2 list-none">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 items-start text-sm leading-relaxed">
          <span className="text-[#999] shrink-0 w-6 text-right pt-0.5">
            {items.length > 1 ? `${i + 1}.` : ""}
          </span>
          <div className="flex-1 min-w-0">
            <Editable multiline value={it} placeholder="點此編輯..." onChange={(v) => updateAt(i, v)} />
          </div>
          {items.length > 1 && (
            <button
              type="button"
              className="shrink-0 text-[#999] hover:text-[#D5705D] p-1"
              onClick={() => removeAt(i)}
              aria-label="移除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
      <li>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-[#666] hover:text-[#1B2D6B] px-1 py-1"
          onClick={add}
        >
          <Plus className="h-3 w-3" /> 新增段落
        </button>
      </li>
    </ol>
  )
}
```

- [ ] **Step 3: Type-check + commit**

```bash
pnpm --dir frontend build
git add frontend/src/components/direct/ListSection.tsx frontend/src/components/direct/PlaceholderBlock.tsx
git commit -m "feat: add ListSection and PlaceholderBlock"
```

---

## Task 10: `DocCanvas` — top stamp, chips, meta block

**Files:**
- Create: `frontend/src/components/direct/DocCanvas.tsx`

The hook from Task 5 already exposes `state`, `mergedIntent`, `update`, `overrideIntent`. This task wires only the top half of the document; sender/receiver are still simple `Editable` text — they'll be upgraded to OrganSelector in Task 12.

- [ ] **Step 1: Write the component**

```typescript
import type { UseDirectDocStateReturn } from "./useDirectDocState"
import type { DocType } from "@/types"
import Editable from "./Editable"
import Pickable from "./Pickable"
import TagsInline from "./TagsInline"
import { DOC_TYPES, DIRECTIONS } from "./constants"

interface DocCanvasProps {
  hook: UseDirectDocStateReturn
}

export default function DocCanvas({ hook }: DocCanvasProps) {
  const { state, mergedIntent, update, overrideIntent } = hook
  const docType = state.docType
  const direction = state.phrases?.direction ?? "平行文"
  const subtype = mergedIntent?.subtype ?? ""
  const directionColor =
    direction === "上行文"
      ? "bg-[#FEE7E5] text-[#991B1B]"
      : direction === "下行文"
      ? "bg-[#DCFCE7] text-[#065F46]"
      : "bg-[#DBEAFE] text-[#1E40AF]"

  return (
    <article className="bg-white rounded-lg shadow-sm border border-[#E1E1E1] p-8 max-w-3xl mx-auto font-serif">
      <header className="flex items-baseline justify-between border-b border-[#1B2D6B] pb-3">
        <Editable
          value={mergedIntent?.sender ?? ""}
          placeholder="點此輸入發文機關"
          className="text-2xl font-bold text-[#1B2D6B] tracking-wider"
          onChange={(v) => overrideIntent({ sender: v }, "sender")}
          recent={state.recentChange === "sender"}
        />
        <Pickable
          value={docType}
          options={[...DOC_TYPES]}
          className="text-xl font-semibold text-[#1B2D6B]"
          onChange={(v) => update({ docType: v as DocType }, "doc_type")}
          recent={state.recentChange === "doc_type"}
        />
      </header>

      <div className="flex items-center gap-2 mt-3">
        <Pickable
          value={direction}
          options={[...DIRECTIONS]}
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${directionColor}`}
          onChange={(v) => update({ phrases: state.phrases ? { ...state.phrases, direction: v as typeof direction } : null }, "direction")}
          recent={state.recentChange === "direction"}
        />
        {subtype && (
          <Editable
            value={subtype}
            className="text-xs px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#9A3412]"
            onChange={(v) => overrideIntent({ subtype: v }, "subtype")}
            recent={state.recentChange === "subtype"}
          />
        )}
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-y-2 text-sm">
        <div className="flex items-baseline gap-2">
          <dt className="text-[#666] shrink-0 w-20">受文者：</dt>
          <dd className="flex-1">
            <Editable
              value={mergedIntent?.receiver ?? ""}
              placeholder="點此輸入受文者..."
              onChange={(v) => overrideIntent({ receiver: v }, "receiver")}
              recent={state.recentChange === "receiver"}
            />
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-2">
            <dt className="text-[#666] shrink-0 w-20">發文日期：</dt>
            <dd className="flex-1">
              <Editable
                value={state.doc_date}
                placeholder="如：115年04月29日"
                onChange={(v) => update({ doc_date: v }, "doc_date")}
                recent={state.recentChange === "doc_date"}
              />
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[#666] shrink-0 w-20">發文字號：</dt>
            <dd className="flex-1">
              <Editable
                value={state.doc_number}
                placeholder="如：保普字第1150010234號"
                onChange={(v) => update({ doc_number: v }, "doc_number")}
                recent={state.recentChange === "doc_number"}
              />
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[#666] shrink-0 w-20">速別：</dt>
            <dd className="flex-1">
              <Pickable
                value={state.speed}
                options={["最速件", "速件", "普通件"]}
                onChange={(v) => update({ speed: v as "最速件" | "速件" | "普通件" }, "speed")}
                recent={state.recentChange === "speed"}
              />
            </dd>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-[#666] shrink-0 w-20">附件：</dt>
          <dd className="flex-1">
            <TagsInline tags={state.attachments} onChange={(t) => update({ attachments: t }, "attachments")} placeholder="+ 附件" />
          </dd>
        </div>
      </dl>
    </article>
  )
}
```

- [ ] **Step 2: Add `constants.ts`**

```typescript
// frontend/src/components/direct/constants.ts
export const DOC_TYPES = ["函", "書函", "簽", "便簽", "公告", "令", "開會通知單"] as const
export const DIRECTIONS = ["上行文", "平行文", "下行文"] as const

export const EXAMPLES = [
  { title: "公示送達", text: "勞保局有一批投保單位歇業了要逕行退保，但通知函地址不明送不到，需要公告送達" },
  { title: "預告法規", text: "環保署要修正空氣污染排放標準，需要先預告草案讓各界提供意見" },
  { title: "經費簽呈", text: "我們處要導入主計總處的共用經費結報系統，需要成立工作小組並分階段上線，請簽核" },
]
```

- [ ] **Step 3: Mount DocCanvas in DirectEditPage**

Edit `frontend/src/components/direct/DirectEditPage.tsx`. Replace the `[DocCanvas placeholder]` section with:

```typescript
import { useDirectDocState } from "./useDirectDocState"
import DocCanvas from "./DocCanvas"

// ...inside component:
const hook = useDirectDocState()

// In the <section>:
<section className="overflow-y-auto p-6 lg:p-10">
  <DocCanvas hook={hook} />
</section>
```

- [ ] **Step 4: Type-check + manual smoke**

```bash
pnpm --dir frontend build
pnpm --dir frontend dev
```
Open `?direct=1`. Expected: a 公文紙 card showing dashed empty state for sender, "點此輸入受文者...", today's date, doc_type pickable defaulting to "函", direction defaulting to "平行文". Click sender → input appears → type, blur → text persists with flash animation.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/direct/{DocCanvas.tsx,constants.ts,DirectEditPage.tsx}
git commit -m "feat: DocCanvas top stamp + chips + meta block with inline editors"
```

---

## Task 11: `DocCanvas` — sections (主旨/說明/辦法) + placeholder

**Files:**
- Modify: `frontend/src/components/direct/DocCanvas.tsx`

- [ ] **Step 1: Add sections below the meta block**

After the closing `</dl>` of the meta block, add:

```typescript
      <hr className="my-5 border-t border-[#E1E1E1]" />

      <section className="space-y-4">
        <SectionRow label="主旨">
          {state.subject_detail ? (
            <Editable
              multiline
              value={state.subject_detail}
              onChange={(v) => update({ subject_detail: v }, "subject_detail")}
              recent={state.recentChange === "subject_detail"}
              className="text-sm leading-relaxed"
            />
          ) : state.phase === "ready" ? (
            <Editable
              multiline
              value=""
              placeholder="點此撰寫主旨..."
              onChange={(v) => update({ subject_detail: v }, "subject_detail")}
            />
          ) : (
            <PlaceholderBlock unansweredCount={hook.unansweredRequired.length} />
          )}
        </SectionRow>

        <SectionRow label="說明">
          {state.phase === "ready" || state.explanation_items.length > 0 ? (
            <ListSection
              items={state.explanation_items}
              placeholder="點此新增說明事項..."
              onChange={(items) => update({ explanation_items: items }, "explanation_items")}
            />
          ) : (
            <PlaceholderBlock unansweredCount={hook.unansweredRequired.length} />
          )}
        </SectionRow>

        <SectionRow label={state.docType === "公告" ? "公告事項" : state.docType === "簽" || state.docType === "便簽" ? "擬辦" : "辦法"}>
          {state.phase === "ready" || state.action_items.length > 0 ? (
            <ListSection
              items={state.action_items}
              placeholder="點此新增段落..."
              onChange={(items) => update({ action_items: items }, "action_items")}
            />
          ) : (
            <PlaceholderBlock unansweredCount={hook.unansweredRequired.length} />
          )}
        </SectionRow>
      </section>

      <footer className="mt-8 text-right text-sm text-[#1B2D6B]">
        <div className="font-semibold">{mergedIntent?.sender || "—"}</div>
        <div className="text-xs text-[#666] mt-1">機關首長</div>
      </footer>
```

Add the `SectionRow` helper at the bottom of the file:

```typescript
function SectionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-12 text-sm font-semibold text-[#1B2D6B] pt-0.5">{label}：</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
```

Add imports at top: `import ListSection from "./ListSection"`, `import PlaceholderBlock from "./PlaceholderBlock"`.

- [ ] **Step 2: Type-check + manual smoke**

```bash
pnpm --dir frontend build
pnpm --dir frontend dev
```
Open `?direct=1`. Expected: 主旨/說明/辦法 sections show dashed "待補充" placeholders. Phase is `onboarding` → unanswered shows 0 (since clarifyQuestions empty). Foot block shows "—" then "機關首長".

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/direct/DocCanvas.tsx
git commit -m "feat: DocCanvas sections (主旨/說明/辦法) with placeholder fallback"
```

---

## Task 12: Wire OrganSelector for sender/receiver

**Files:**
- Modify: `frontend/src/components/direct/DocCanvas.tsx`
- Modify: `frontend/src/components/direct/DirectEditPage.tsx`

OrganSelector is self-contained (`OrganSelectorProps` from `OrganSelector.tsx:15`). It triggers a popover internally. We mount it directly inline, replacing the `Editable` for sender and receiver. Pass `organTree` from `DirectEditPage`.

- [ ] **Step 1: Fetch organ tree in `DirectEditPage`**

Add to top of `DirectEditPage.tsx`:

```typescript
import { useEffect, useState } from "react"
import type { OrganNode } from "@/types"
```

Inside the component (after `const hook = useDirectDocState()`), add:

```typescript
  const [organTree, setOrganTree] = useState<OrganNode[]>([])
  useEffect(() => {
    fetch("/api/organs")
      .then((r) => r.json())
      .then((data: OrganNode[]) => setOrganTree(data))
      .catch(() => {})
  }, [])
```

Pass to DocCanvas: `<DocCanvas hook={hook} organTree={organTree} />`.

- [ ] **Step 2: Update `DocCanvas` props and replace sender/receiver Editables**

In `DocCanvas.tsx`:

```typescript
import OrganSelector from "@/components/OrganSelector"
import type { OrganNode } from "@/types"
import type { OrganSelectInfo } from "@/components/OrganSelector"

interface DocCanvasProps {
  hook: UseDirectDocStateReturn
  organTree: OrganNode[]
}

export default function DocCanvas({ hook, organTree }: DocCanvasProps) {
  // ...existing destructuring
  const handleSender = (info: OrganSelectInfo) => {
    overrideIntent(
      {
        sender: info.name,
        sender_level: info.level ?? 0,
        sender_parent: info.parentContext ?? "",
      },
      "sender"
    )
  }
  const handleReceiver = (info: OrganSelectInfo) => {
    overrideIntent(
      {
        receiver: info.name,
        receiver_level: info.level ?? 0,
        receiver_parent: info.parentContext ?? "",
        receiver_type: (info.receiverType as IntentResult["receiver_type"]) ?? mergedIntent?.receiver_type ?? "政府機關",
        receiver_display_name: info.isCustom ? info.name : "",
      },
      "receiver"
    )
  }
```

Replace the sender `<Editable>` in the header with:

```typescript
        <div className="text-2xl font-bold text-[#1B2D6B] tracking-wider min-w-[12rem]">
          <OrganSelector
            label="發文機關"
            value={mergedIntent?.sender ?? ""}
            onChange={handleSender}
            organTree={organTree}
            placeholder="點此選擇發文機關"
          />
        </div>
```

Replace the receiver `<Editable>` (in the meta block) with:

```typescript
            <OrganSelector
              label="受文者"
              value={mergedIntent?.receiver ?? ""}
              onChange={handleReceiver}
              organTree={organTree}
              placeholder="點此選擇受文者"
            />
```

Also import `IntentResult` type at the top: `import type { IntentResult } from "@/types"`.

- [ ] **Step 3: Type-check + manual smoke**

```bash
pnpm --dir frontend build
pnpm --dir frontend dev
```
Open `?direct=1`. Expected: clicking sender or receiver opens the OrganSelector popover with the category tree; picking an organ updates the preview and triggers the flash. (OrganSelector's internal styling may not match the 公文紙 aesthetic perfectly — that's acceptable for now.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/direct/{DocCanvas.tsx,DirectEditPage.tsx}
git commit -m "feat: wire OrganSelector for sender/receiver in DocCanvas"
```

---

## Task 13: `OnboardingOverlay`

**Files:**
- Create: `frontend/src/components/direct/OnboardingOverlay.tsx`
- Modify: `frontend/src/components/direct/DirectEditPage.tsx`

- [ ] **Step 1: Write the overlay**

```typescript
import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { EXAMPLES } from "./constants"

interface OnboardingOverlayProps {
  onSubmit: (text: string) => void | Promise<void>
  onBlank: () => void
  loading: boolean
}

export default function OnboardingOverlay({ onSubmit, onBlank, loading }: OnboardingOverlayProps) {
  const [text, setText] = useState("")
  return (
    <div className="absolute inset-0 z-30 bg-[#F5F1EC]/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-[#E1E1E1] p-8">
        <div className="flex items-center gap-2 text-xs text-[#666] uppercase tracking-wider">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F5922A] animate-pulse" />
          開始撰寫公文
        </div>
        <h1 className="mt-3 text-3xl font-bold text-[#1B2D6B]">直接在公文紙上撰寫</h1>
        <p className="mt-2 text-sm text-[#666]">
          點擊任何欄位即可編輯。需要 AI 幫忙？右側面板隨時呼叫。
        </p>

        <div className="mt-6">
          <textarea
            className="w-full h-24 rounded-lg border border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-1 focus:ring-[#1B2D6B]/20 px-3 py-2 text-sm resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="用一句話描述您要發的公文..."
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(text)
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-[#999]">⌘+Enter 送出</div>
            <button
              type="button"
              className="inline-flex items-center gap-1 bg-[#F5922A] hover:bg-[#D47B22] disabled:opacity-50 text-white rounded-full px-4 py-2 text-sm font-medium"
              onClick={() => onSubmit(text)}
              disabled={!text.trim() || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              AI 分析
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EXAMPLES.map((ex, i) => (
            <button
              key={ex.title}
              type="button"
              className="text-left p-3 rounded-lg border border-[#E1E1E1] hover:border-[#1B2D6B] hover:bg-[#F5F1EC] transition-colors"
              onClick={() => setText(ex.text)}
              disabled={loading}
            >
              <div className="text-xs text-[#999]">0{i + 1}</div>
              <div className="text-sm font-medium text-[#1B2D6B] mt-0.5">{ex.title}</div>
              <div className="text-xs text-[#666] mt-1 line-clamp-2">{ex.text}</div>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="mt-4 text-xs text-[#666] hover:text-[#1B2D6B]"
          onClick={onBlank}
          disabled={loading}
        >
          或從空白公文開始 →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Mount the overlay in `DirectEditPage`**

In `DirectEditPage.tsx` add to imports:
```typescript
import OnboardingOverlay from "./OnboardingOverlay"
```

Make the page container `relative` so the absolute overlay covers it. Change the outermost div to:

```typescript
<div className="h-screen flex flex-col overflow-hidden bg-[#F5F1EC] relative">
```

Inside the outer div (after `<header>`, before `<main>`), add:

```typescript
{(state.phase === "onboarding" || state.phase === "parsing") && (
  <OnboardingOverlay
    onSubmit={hook.onSubmitOnboarding}
    onBlank={() => hook.setPhase("ready")}
    loading={state.phase === "parsing"}
  />
)}
```

Reference `state` from the hook by destructuring `const { state } = hook` at the top of the function.

- [ ] **Step 3: Type-check + manual smoke**

```bash
pnpm --dir frontend build
pnpm --dir frontend dev
```
Open `?direct=1`. Expected: overlay covers the page. Click "公示送達" → text fills textarea. Click "AI 分析" → spinner → after ~3-5s, overlay dismisses, sender/receiver/subtype populated on the canvas, 主旨/說明/辦法 sections show "待補充". Backend logs in the terminal show parse-intent + clarify + suggest-laws hits.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/direct/{OnboardingOverlay.tsx,DirectEditPage.tsx}
git commit -m "feat: OnboardingOverlay with examples + AI parse trigger"
```

---

## Task 14: `AiPanel` shell + tabs

**Files:**
- Create: `frontend/src/components/direct/AiPanel.tsx`
- Modify: `frontend/src/components/direct/DirectEditPage.tsx`

- [ ] **Step 1: Write `AiPanel`**

```typescript
import { useState } from "react"
import { Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UseDirectDocStateReturn } from "./useDirectDocState"

interface AiPanelProps {
  hook: UseDirectDocStateReturn
  onOpenLawSearch: () => void
}

type Tab = "chat" | "suggestions" | "laws"

export default function AiPanel({ hook, onOpenLawSearch }: AiPanelProps) {
  const [tab, setTab] = useState<Tab>("suggestions")
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <button
        type="button"
        className="fixed bottom-6 right-6 z-20 bg-[#1B2D6B] hover:bg-[#152456] text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-2 text-sm font-medium"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        AI 助理
      </button>
    )
  }

  const unansweredCount = hook.unansweredRequired.length
  return (
    <aside className="border-l border-[#E1E1E1] bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E1E1E1]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#F5922A]" />
          <div>
            <div className="text-sm font-semibold text-[#1B2D6B]">AI 助理</div>
            <div className="text-xs text-[#999]">依公文進度提供建議</div>
          </div>
        </div>
        <button
          type="button"
          className="text-[#999] hover:text-[#1B2D6B] p-1"
          onClick={() => setOpen(false)}
          aria-label="收合"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-[#E1E1E1] text-sm">
        {([
          ["chat", "對話"],
          ["suggestions", `建議${unansweredCount > 0 ? ` ${unansweredCount}` : ""}`],
          ["laws", "法規"],
        ] as Array<[Tab, string]>).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={cn(
              "flex-1 py-2 text-center hover:bg-[#F5F1EC]",
              tab === key && "border-b-2 border-[#F5922A] text-[#1B2D6B] font-medium"
            )}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm">
        {tab === "chat" && <div className="text-[#999]">[AiTabChat — Task 17]</div>}
        {tab === "suggestions" && <div className="text-[#999]">[AiTabSuggestions — Task 15]</div>}
        {tab === "laws" && (
          <button type="button" className="text-[#1B2D6B] underline" onClick={onOpenLawSearch}>
            [AiTabLaws — Task 16] · 開啟搜尋 modal
          </button>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Mount in `DirectEditPage`**

Add import: `import AiPanel from "./AiPanel"`.
Replace the `[AiPanel placeholder]` aside with:

```typescript
<AiPanel hook={hook} onOpenLawSearch={() => alert("law modal — Task 16")} />
```

Wrap aside not in `<aside>` directly — `AiPanel` already returns one. Remove the outer `<aside>` wrapper.

- [ ] **Step 3: Type-check + smoke + commit**

```bash
pnpm --dir frontend build
git add frontend/src/components/direct/{AiPanel.tsx,DirectEditPage.tsx}
git commit -m "feat: AiPanel shell with collapsible FAB and tabs"
```

---

## Task 15: `AiTabSuggestions` — clarify cards

**Files:**
- Create: `frontend/src/components/direct/AiTabSuggestions.tsx`
- Modify: `frontend/src/components/direct/AiPanel.tsx` (use the new tab)

- [ ] **Step 1: Write `AiTabSuggestions`**

```typescript
import { Check } from "lucide-react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"

interface AiTabSuggestionsProps {
  hook: UseDirectDocStateReturn
}

export default function AiTabSuggestions({ hook }: AiTabSuggestionsProps) {
  const { state, answerClarify } = hook

  if (state.phase === "onboarding" || state.phase === "parsing") {
    return (
      <div className="text-sm text-[#999]">
        先描述您的公文，AI 才能提供建議。
      </div>
    )
  }

  if (state.clarifyQuestions.length === 0) {
    return <div className="text-sm text-[#999]">無需釐清，可直接編輯預覽。</div>
  }

  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-wider text-[#666]">需要釐清</div>
      {state.clarifyQuestions.map((q) => {
        const answered = state.answers[q.field_key]
        if (answered) {
          return (
            <div
              key={q.field_key}
              className="rounded-md border border-[#E1E1E1] bg-[#F5F1EC] px-3 py-2 text-sm flex items-center justify-between"
            >
              <span className="text-[#666]">{q.header}</span>
              <span className="inline-flex items-center gap-1 text-[#065F46]">
                <Check className="h-3 w-3" /> {answered}
              </span>
            </div>
          )
        }
        return (
          <div key={q.field_key} className="rounded-md border border-[#E1E1E1] bg-white p-3">
            <div className="text-xs text-[#999] uppercase tracking-wider">{q.header}</div>
            <div className="text-sm text-[#222] mt-0.5">{q.question}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {q.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className="text-xs px-2 py-1 rounded-full border border-[#E1E1E1] hover:border-[#1B2D6B] hover:bg-[#F5F1EC]"
                  title={opt.description}
                  onClick={() => answerClarify(q.field_key, opt.label)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {state.phase === "generating" && (
        <div className="text-xs text-[#F5922A] flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F5922A] animate-pulse" />
          AI 正在生成草稿...
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into AiPanel**

In `AiPanel.tsx`, add `import AiTabSuggestions from "./AiTabSuggestions"` and replace the `{tab === "suggestions" && ...}` block with `{tab === "suggestions" && <AiTabSuggestions hook={hook} />}`.

- [ ] **Step 3: Type-check + manual smoke**

```bash
pnpm --dir frontend build
pnpm --dir frontend dev
```
Open `?direct=1`, click "公示送達", click "AI 分析". Expected: after parse, AI panel "建議" tab shows clarify cards with option pills. Click an option → card collapses to "✓ 已選：…". When all answered → spinner shows "AI 正在生成草稿..." → after a few seconds, 主旨/說明/辦法 fill in.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/direct/{AiTabSuggestions.tsx,AiPanel.tsx}
git commit -m "feat: AiTabSuggestions clarify cards (answers trigger generate-with-answers)"
```

---

## Task 16: `AiTabLaws` + Step3LawSuggestion modal

**Files:**
- Create: `frontend/src/components/direct/AiTabLaws.tsx`
- Create: `frontend/src/components/direct/LawSearchModal.tsx`
- Modify: `frontend/src/components/direct/AiPanel.tsx`
- Modify: `frontend/src/components/direct/DirectEditPage.tsx`

- [ ] **Step 1: Write `LawSearchModal`**

```typescript
import { X } from "lucide-react"
import Step3LawSuggestion from "@/components/Step3LawSuggestion"
import type { SelectedLaw, LawSuggestion } from "./directTypes"

interface LawSearchModalProps {
  open: boolean
  onClose: () => void
  initialSuggestions: LawSuggestion[]
  onSave: (selected: SelectedLaw[]) => void
}

export default function LawSearchModal({ open, onClose, initialSuggestions, onSave }: LawSearchModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-stretch justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E1E1E1]">
          <h2 className="text-base font-semibold text-[#1B2D6B]">法規瀏覽 / 搜尋</h2>
          <button type="button" className="text-[#999] hover:text-[#1B2D6B] p-1" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Step3LawSuggestion
            suggestions={initialSuggestions}
            onNext={(selected) => {
              onSave(selected)
              onClose()
            }}
            onBack={onClose}
            onSkip={onClose}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `AiTabLaws`**

```typescript
import { Plus, Check } from "lucide-react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"

interface AiTabLawsProps {
  hook: UseDirectDocStateReturn
  onOpenSearch: () => void
}

export default function AiTabLaws({ hook, onOpenSearch }: AiTabLawsProps) {
  const { state, update, regenerate } = hook
  const cited = state.citations
  const suggested = state.lawSuggestions

  return (
    <div className="space-y-3">
      {cited.length > 0 && (
        <>
          <div className="text-xs uppercase tracking-wider text-[#666]">已引用 ({cited.length})</div>
          {cited.map((c, i) => (
            <div key={`c-${i}`} className="rounded-md border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-2 text-sm">
              <div className="flex items-center gap-1 text-[#065F46]">
                <Check className="h-3 w-3" />
                <span className="font-medium">{c.law_name}</span>
              </div>
              {c.article_no && <div className="text-xs text-[#666] mt-0.5">{c.article_no}</div>}
            </div>
          ))}
        </>
      )}

      {suggested.length > 0 && (
        <>
          <div className="text-xs uppercase tracking-wider text-[#666] mt-3">AI 推薦</div>
          {suggested.map((s) => {
            const isSelected = state.selectedLaws.some((sl) => sl.law_name === s.law_name)
            return (
              <div key={s.law_name} className="rounded-md border border-[#E1E1E1] bg-white px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#222]">{s.law_name}</span>
                  <button
                    type="button"
                    className="text-xs text-[#1B2D6B] hover:underline"
                    onClick={() => {
                      const next = isSelected
                        ? state.selectedLaws.filter((sl) => sl.law_name !== s.law_name)
                        : [
                            ...state.selectedLaws,
                            {
                              law_name: s.law_name,
                              articles: s.articles.map((a) => ({ ...a, checked: true })),
                            },
                          ]
                      update({ selectedLaws: next })
                    }}
                  >
                    {isSelected ? "✓ 已加入" : "+ 加入引用"}
                  </button>
                </div>
                {s.category && <div className="text-xs text-[#999] mt-0.5">{s.category}</div>}
              </div>
            )
          })}
        </>
      )}

      <button
        type="button"
        className="w-full mt-2 inline-flex items-center justify-center gap-1 text-sm text-[#1B2D6B] border border-dashed border-[#1B2D6B] rounded-md py-2 hover:bg-[#F5F1EC]"
        onClick={onOpenSearch}
      >
        <Plus className="h-3 w-3" /> 搜尋更多法規
      </button>

      {state.phase === "ready" && (
        <button
          type="button"
          className="w-full text-sm bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-md py-2 font-medium mt-2"
          onClick={regenerate}
        >
          以最新法規重新生成
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Wire modal + tab**

In `DirectEditPage.tsx`:

```typescript
import LawSearchModal from "./LawSearchModal"

// inside component:
const [lawSearchOpen, setLawSearchOpen] = useState(false)

// in JSX (top level inside the outer div):
<LawSearchModal
  open={lawSearchOpen}
  onClose={() => setLawSearchOpen(false)}
  initialSuggestions={hook.state.lawSuggestions}
  onSave={(selected) => hook.update({ selectedLaws: selected })}
/>

// pass setter to AiPanel:
<AiPanel hook={hook} onOpenLawSearch={() => setLawSearchOpen(true)} />
```

In `AiPanel.tsx`:

```typescript
import AiTabLaws from "./AiTabLaws"
// replace the laws tab block:
{tab === "laws" && <AiTabLaws hook={hook} onOpenSearch={onOpenLawSearch} />}
```

- [ ] **Step 4: Type-check + smoke**

```bash
pnpm --dir frontend build
pnpm --dir frontend dev
```
Run the happy path. Expected: 法規 tab shows AI suggestions and (after generate) the cited laws. Click "搜尋更多法規" → modal opens with the existing Step3LawSuggestion UI; pick laws → save closes modal → 法規 tab shows them as selected. Click "以最新法規重新生成" → spinner → 主旨/說明/辦法 update.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/direct/{AiTabLaws.tsx,LawSearchModal.tsx,AiPanel.tsx,DirectEditPage.tsx}
git commit -m "feat: AiTabLaws + Step3LawSuggestion modal + regenerate"
```

---

## Task 17: `AiTabChat` (stub) + header buttons (undo/restart/export)

**Files:**
- Create: `frontend/src/components/direct/AiTabChat.tsx`
- Create: `frontend/src/components/direct/Header.tsx`
- Modify: `frontend/src/components/direct/AiPanel.tsx`
- Modify: `frontend/src/components/direct/DirectEditPage.tsx`

- [ ] **Step 1: Write `AiTabChat` (stub: canned questions + regenerate)**

```typescript
import { Loader2, Send } from "lucide-react"
import { useState } from "react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"

interface AiTabChatProps {
  hook: UseDirectDocStateReturn
}

const QUICK_QUESTIONS = [
  "這個主旨可以更精簡嗎？",
  "把第二段改成正式語氣",
  "加上罰則段落",
]

export default function AiTabChat({ hook }: AiTabChatProps) {
  const [text, setText] = useState("")
  const submitting = hook.state.phase === "generating"

  const handleSubmit = async () => {
    if (!text.trim()) return
    // v1 stub: trigger regen — text is not yet sent to backend (no chat endpoint)
    await hook.regenerate()
    setText("")
  }

  return (
    <div className="space-y-3">
      {hook.state.phase === "ready" ? (
        <div className="text-sm text-[#666]">
          已生成草稿。直接點預覽欄位修改，或在下方輸入修改要求。
        </div>
      ) : (
        <div className="text-sm text-[#666]">
          先描述要發的公文，AI 將起草草稿。
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            className="text-xs px-2 py-1 rounded-full border border-[#E1E1E1] hover:border-[#1B2D6B]"
            onClick={() => setText(q)}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="border border-[#E1E1E1] rounded-md p-2 flex gap-2 items-end">
        <textarea
          className="flex-1 text-sm resize-none focus:outline-none"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="告訴 AI 您要修改什麼..."
          disabled={submitting}
        />
        <button
          type="button"
          className="bg-[#1B2D6B] hover:bg-[#152456] disabled:opacity-50 text-white p-2 rounded-md"
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <div className="text-xs text-[#999]">⌘+Enter 送出（v1 等同重新生成；尚未串接 chat 端點）</div>
    </div>
  )
}
```

In `AiPanel.tsx`: `import AiTabChat from "./AiTabChat"` and replace the `{tab === "chat" && ...}` block with `{tab === "chat" && <AiTabChat hook={hook} />}`.

- [ ] **Step 2: Write `Header`**

```typescript
import { Undo2, Send, Download, RefreshCw } from "lucide-react"

interface HeaderProps {
  canUndo: boolean
  onUndo: () => void
  onRestart: () => void
  onExport: () => void
}

export default function Header({ canUndo, onUndo, onRestart, onExport }: HeaderProps) {
  return (
    <header className="border-b border-[#E1E1E1] bg-white shrink-0 px-4 lg:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img src="/gtaide_logo.svg" alt="GTAIDE" className="h-7" />
        <div className="hidden sm:block h-5 w-px bg-[#E1E1E1]" />
        <span className="hidden sm:inline text-base font-semibold text-[#1B2D6B]">
          SmartOD <span className="text-[#666] font-normal">· 直接編輯版</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-xs text-[#666] mr-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#065F46] mr-1" />
          自動儲存中
        </span>
        <button
          type="button"
          className="p-2 rounded hover:bg-[#F5F1EC] text-[#666] disabled:opacity-30"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="復原"
          title="復原"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-2 rounded hover:bg-[#F5F1EC] text-[#666]"
          onClick={onRestart}
          aria-label="重新開始"
          title="重新開始"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-[#E1E1E1] hover:bg-[#F5F1EC] text-[#1B2D6B]"
          onClick={onExport}
        >
          <Download className="h-4 w-4" /> 匯出
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-[#F5922A] hover:bg-[#D47B22] text-white font-medium"
          onClick={onExport}
        >
          送出簽核 <Send className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Mount `Header` in `DirectEditPage`**

Replace the inline header in `DirectEditPage.tsx` with:

```typescript
<Header
  canUndo={hook.canUndo}
  onUndo={hook.undo}
  onRestart={hook.reset}
  onExport={() => setExportOpen(true)}
/>
```

Add `const [exportOpen, setExportOpen] = useState(false)` and an `import Header from "./Header"`. The export modal is wired in Task 18; until then, ESLint may warn about unused `exportOpen` — add `// eslint-disable-next-line @typescript-eslint/no-unused-vars` above the `setExportOpen` line, or use `void setExportOpen` once. (Removed in Task 18 when the modal consumes it.)

- [ ] **Step 4: Type-check + smoke**

```bash
pnpm --dir frontend build
pnpm --dir frontend dev
```
Open `?direct=1`. Expected: header shows undo (disabled initially), restart, 匯出, 送出簽核. Edit a field → undo enables. Click undo → field reverts. Click restart → state resets, overlay re-shows.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/direct/{AiTabChat.tsx,Header.tsx,AiPanel.tsx,DirectEditPage.tsx}
git commit -m "feat: AiTabChat stub + Header (undo/restart/export buttons)"
```

---

## Task 18: Export modal — render via existing pipeline

**Files:**
- Create: `frontend/src/components/direct/ExportModal.tsx`
- Modify: `frontend/src/components/direct/DirectEditPage.tsx`

The existing `Step4Preview` (alias `Step6Preview`) takes `intent` + `form` and calls `/api/generate` then displays the rendered HTML. We mount it inside a modal.

- [ ] **Step 1: Write `ExportModal`**

```typescript
import { X } from "lucide-react"
import Step4Preview from "@/components/Step4Preview"
import type { IntentResult, GenerateRequest } from "@/types"

interface ExportModalProps {
  open: boolean
  onClose: () => void
  intent: IntentResult
  form: GenerateRequest
}

export default function ExportModal({ open, onClose, intent, form }: ExportModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-stretch justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E1E1E1]">
          <h2 className="text-base font-semibold text-[#1B2D6B]">預覽 / 匯出公文</h2>
          <button type="button" className="text-[#999] hover:text-[#1B2D6B] p-1" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Step4Preview
            intent={intent}
            form={form}
            onBackToEdit={onClose}
            onRestart={onClose}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Mount it in `DirectEditPage`**

In `DirectEditPage.tsx`, build a `GenerateRequest` from the hook state. Add a helper:

```typescript
import type { GenerateRequest, IntentResult } from "@/types"
import ExportModal from "./ExportModal"

function buildGenerateRequest(hook: UseDirectDocStateReturn): { intent: IntentResult; form: GenerateRequest } | null {
  const merged = hook.mergedIntent
  if (!merged) return null
  const s = hook.state
  const form: GenerateRequest = {
    intent: merged,
    subject_detail: s.subject_detail,
    explanation_items: s.explanation_items,
    action_items: s.action_items,
    recipients_main: s.recipients_main,
    recipients_cc: s.recipients_cc,
    doc_date: s.doc_date,
    doc_number: s.doc_number,
    speed: s.speed,
    attachments_text: s.attachments.join("、"),
    meeting_time: s.meeting_time || undefined,
    meeting_place: s.meeting_place || undefined,
    meeting_chair: s.meeting_chair || undefined,
    meeting_contact: s.meeting_contact || undefined,
    meeting_contact_phone: s.meeting_contact_phone || undefined,
    meeting_attendees: s.meeting_attendees.length ? s.meeting_attendees : undefined,
    meeting_observers: s.meeting_observers.length ? s.meeting_observers : undefined,
    meeting_notes: s.meeting_notes || undefined,
  }
  return { intent: merged, form }
}
```

Add to the JSX:

```typescript
{(() => {
  const built = buildGenerateRequest(hook)
  if (!built) return null
  return (
    <ExportModal
      open={exportOpen}
      onClose={() => setExportOpen(false)}
      intent={built.intent}
      form={built.form}
    />
  )
})()}
```

Import `UseDirectDocStateReturn`: `import type { UseDirectDocStateReturn } from "./useDirectDocState"`.

- [ ] **Step 3: Type-check + smoke**

```bash
pnpm --dir frontend build
pnpm --dir frontend dev
```
Run happy path → click 匯出 → modal opens with rendered document. Close modal — state preserved.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/direct/{ExportModal.tsx,DirectEditPage.tsx}
git commit -m "feat: export modal mounting Step4Preview with current state"
```

---

## Task 19: `BottomStatusBar`

**Files:**
- Create: `frontend/src/components/direct/BottomStatusBar.tsx`
- Modify: `frontend/src/components/direct/DirectEditPage.tsx`

- [ ] **Step 1: Write the bar**

```typescript
import { AlertTriangle, Check } from "lucide-react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"

interface BottomStatusBarProps {
  hook: UseDirectDocStateReturn
}

export default function BottomStatusBar({ hook }: BottomStatusBarProps) {
  const { state, mergedIntent } = hook
  if (state.phase === "onboarding" || state.phase === "parsing") {
    return <footer className="border-t border-[#E1E1E1] bg-white shrink-0 h-11" />
  }

  const completed = [
    !!mergedIntent?.sender,
    !!mergedIntent?.receiver || mergedIntent?.action_type === "公布法令",
    !!state.subject_detail,
    state.explanation_items.filter(Boolean).length > 0,
    state.action_items.filter(Boolean).length > 0,
    !!state.doc_number,
  ].filter(Boolean).length
  const pct = Math.round((completed / 6) * 100)

  const warnings: string[] = []
  if (!state.subject_detail) warnings.push("缺少主旨")
  if (state.explanation_items.filter(Boolean).length === 0) warnings.push("缺少說明")
  if (!state.doc_number) warnings.push("缺少發文字號")

  return (
    <footer className="border-t border-[#E1E1E1] bg-white shrink-0 px-4 py-2 flex items-center gap-4 text-xs h-11 overflow-hidden">
      <div className="flex items-center gap-2 min-w-[180px]">
        <div className="h-1.5 w-24 bg-[#E1E1E1] rounded-full overflow-hidden">
          <div className="h-full bg-[#F5922A]" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[#666]">完成度 {pct}% · {completed}/6</span>
      </div>
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        {warnings.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-[#065F46]">
            <Check className="h-3 w-3" /> 所有必填欄位已完成
          </span>
        ) : (
          warnings.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 text-[#9A3412] truncate">
              <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
            </span>
          ))
        )}
      </div>
      <div className="hidden md:flex items-center gap-1 text-[#666] truncate">
        <span>{mergedIntent?.sender || "—"}</span>
        <span>·</span>
        <span>{mergedIntent?.subtype || "—"}</span>
        <span>·</span>
        <span>{state.phrases?.direction || "—"}</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Mount it**

In `DirectEditPage.tsx`, replace the `[BottomStatusBar placeholder]` footer with:

```typescript
<BottomStatusBar hook={hook} />
```

Add the import.

- [ ] **Step 3: Type-check + smoke + commit**

```bash
pnpm --dir frontend build
git add frontend/src/components/direct/{BottomStatusBar.tsx,DirectEditPage.tsx}
git commit -m "feat: BottomStatusBar with completion %, warnings, metadata one-liner"
```

---

## Task 20: Mobile responsiveness pass

**Files:**
- Modify: `frontend/src/components/direct/DirectEditPage.tsx`
- Modify: `frontend/src/components/direct/AiPanel.tsx`

- [ ] **Step 1: AiPanel — collapse to FAB on small screens**

In `DirectEditPage.tsx`, change the `<main>` grid:

```typescript
<main className="relative flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">
```

In `AiPanel.tsx`, set initial `open` to true on lg, false on smaller. Replace the `useState(true)` line with:

```typescript
const [open, setOpen] = useState(() =>
  typeof window === "undefined" ? true : window.innerWidth >= 1024
)
```

Make the panel float on small screens — change the `<aside>` to:

```typescript
<aside className="border-l border-[#E1E1E1] bg-white flex flex-col overflow-hidden lg:static fixed inset-y-0 right-0 w-full sm:w-[360px] z-30 shadow-xl lg:shadow-none">
```

- [ ] **Step 2: Verify on dev tools 375px**

```bash
pnpm --dir frontend dev
```
Resize browser to 375px (or use device toolbar). Expected: AiPanel hidden behind FAB; tapping FAB shows full-height drawer. Close button returns to FAB. DocCanvas takes full width.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/direct/{DirectEditPage.tsx,AiPanel.tsx}
git commit -m "feat: AiPanel collapses to FAB on mobile"
```

---

## Task 21: Cutover — make `?direct=1` the default

**Files:**
- Modify: `frontend/src/App.tsx`

This task is run only after all earlier tasks pass the verification scenarios in the section below.

- [ ] **Step 1: Flip the route logic**

In `App.tsx`, change `isDirectMode()` so that direct is the default and `?legacy=1` returns to the wizard:

```typescript
function isLegacyMode(): boolean {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).get("legacy") === "1"
}
```

And:

```typescript
  if (!isLegacyMode()) return <DirectEditPage />
```

(Remove the now-unused `isDirectMode` helper.)

- [ ] **Step 2: Manual smoke — full E2E**

Run the dev server and walk through the verification scenarios below. Confirm `?legacy=1` still renders the old wizard.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: make direct-edit the default; legacy wizard at ?legacy=1"
```

---

## Verification (run after Task 20, before Task 21)

Start backend (`uvicorn app.main:app --reload --port 8000` from `backend/`) and frontend (`pnpm --dir frontend dev`).

1. **Happy path** (`http://localhost:5173/?direct=1`):
   - Click the "公示送達" example chip in the overlay → click "AI 分析".
   - Within ~2s after parse: overlay dismisses; sender, receiver, doc_type pickable, subtype show on the 公文紙.
   - Within ~5s: clarify cards appear in AI panel "建議" tab. 主旨/說明/辦法 sections show "待補充" placeholders.
   - Click each clarify option → cards collapse to "✓ 已選：…".
   - When the last is answered: spinner appears, then 主旨/說明/辦法 fill in. Citations appear in 法規 tab.

2. **Inline edit**: After draft is generated, click the 主旨 sentence → input appears → modify → blur → recent-flash shows yellow background for 800ms; new value persists.

3. **Sender swap**: Click sender on the canvas → OrganSelector opens → pick a different organ → preview updates.

4. **Law modal**: 法規 tab → "+ 搜尋更多法規" → modal opens → search "勞工保險" → pick 2 articles from "勞工保險條例" → save → modal closes → new entries appear in 法規 tab → "以最新法規重新生成" runs without error.

5. **Doc-type switch**: Use the doc_type Pickable to change from 函 to 公告 → action section header switches to "公告事項".

6. **Restart**: Click restart icon in header → state resets, overlay re-shows.

7. **Undo**: Edit any field → click undo → field reverts; flash on previous value.

8. **Export**: Click 匯出 → modal opens; rendered document HTML displays. Close modal → state preserved.

9. **Mobile (375px)**: AI panel collapsed to FAB; FAB tap opens drawer; clarify cards still actionable.

10. **Wizard regression**: Open `http://localhost:5173/` (no query) — confirm 6-step wizard still functional. (Skip after Task 21 cutover; instead test `?legacy=1`.)

11. **Build clean**: `pnpm --dir frontend build` + `pnpm --dir frontend lint` — both pass with no errors. (Existing pre-existing warnings allowed.)

---

## Out of scope (deliberately deferred)

- Real-time AI chat backend endpoint (chat tab is a stub that calls `regenerate`).
- Auto-debounced regen on every law/intent edit — only manual "重新生成" button.
- Backend persistence — page state is ephemeral.
- Visual polish to match `direct-styles.css` exactly — this plan rebuilds with Tailwind to match SmartOD's existing color palette.
- Deletion of legacy step components — left until cutover is stable.
