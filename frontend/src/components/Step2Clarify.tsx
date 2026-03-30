import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageCircleQuestion, Check, ChevronRight } from "lucide-react"

interface QuestionOption {
  label: string
  description: string
}

interface ClarifyQuestion {
  question: string
  header: string
  field_key: string
  options: QuestionOption[]
}

interface ClarifyResult {
  needs_clarification: boolean
  questions: ClarifyQuestion[]
  reasoning: string
  rag_examples?: string[]
}

interface SelectedLawRef {
  law_name: string
  articles: Array<{ no: string; content: string }>
}

interface Step2ClarifyProps {
  intent: Record<string, unknown>
  phrases: Record<string, string>
  docType: string
  direction: string
  subtype: string
  selectedLaws?: SelectedLawRef[]
  onComplete: (content: { subject_detail: string; explanation_items: string[]; action_items: string[] }) => void
  onSkip: () => void
  onBack: () => void
}

export default function Step2Clarify({
  intent,
  phrases,
  docType,
  direction,
  subtype,
  selectedLaws = [],
  onComplete,
  onSkip,
  onBack,
}: Step2ClarifyProps) {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([])
  const [allQuestions, setAllQuestions] = useState<ClarifyQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [activeQ, setActiveQ] = useState(0)
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [noClarify, setNoClarify] = useState(false)
  const [round] = useState(0)
  const [ragExamples, setRagExamples] = useState<string[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchClarification() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, phrases, doc_type: docType, direction, subtype }),
        })
        if (cancelled) return
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = (await res.json()) as ClarifyResult
        if (cancelled) return
        if (data.rag_examples) {
          setRagExamples(data.rag_examples)
        }
        if (!data.needs_clarification || data.questions.length === 0) {
          setNoClarify(true)
        } else {
          setQuestions(data.questions)
          setAllQuestions((prev) => [...prev, ...data.questions])
          setActiveQ(0)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "載入失敗")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchClarification()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Skip if no clarification needed - auto-generate
  useEffect(() => {
    if (noClarify) {
      handleGenerate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noClarify])

  const selectOption = (fieldKey: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }))
    setCustomInputs((prev) => ({ ...prev, [fieldKey]: "" }))
    // Auto advance to next question
    if (activeQ < questions.length - 1) {
      setTimeout(() => setActiveQ((prev) => prev + 1), 200)
    }
  }

  const confirmCustom = (fieldKey: string) => {
    const val = customInputs[fieldKey]?.trim()
    if (val) {
      setAnswers((prev) => ({ ...prev, [fieldKey]: val }))
      if (activeQ < questions.length - 1) {
        setTimeout(() => setActiveQ((prev) => prev + 1), 200)
      }
    }
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.field_key])

  const handleGenerate = async () => {
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/generate-with-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          phrases,
          doc_type: docType,
          direction,
          subtype,
          answers: {
            ...answers,
            ...(additionalNotes.trim() ? { additional_notes: additionalNotes.trim() } : {}),
          },
          previous_questions: [
            ...allQuestions.map((q) => ({
              field_key: q.field_key,
              header: q.header,
              question: q.question,
            })),
            ...(additionalNotes.trim() ? [{ field_key: "additional_notes", header: "其他補充", question: "其他補充資訊" }] : []),
          ],
          selected_laws: selectedLaws.map((l) => ({
            law_name: l.law_name,
            articles: l.articles.map((a) => `${a.no}：${a.content}`),
          })),
          rag_examples: ragExamples,
        }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      onComplete(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失敗")
      setGenerating(false)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (loading || generating || questions.length === 0) return
      const q = questions[activeQ]
      if (!q) return

      if (e.key === "Tab") {
        e.preventDefault()
        const opts = q.options
        const currentAnswer = answers[q.field_key]
        const currentIdx = opts.findIndex((o) => o.label === currentAnswer)
        const nextIdx = (currentIdx + 1) % opts.length
        selectOption(q.field_key, opts[nextIdx].label)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQ, questions, answers, loading, generating])

  if (loading) {
    return (
      <div className="">
        <div className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#F5922A]" />
          <p className="text-[#666]">AI 正在分析需要補充的資訊...</p>
        </div>
      </div>
    )
  }

  if (generating) {
    return (
      <div className="">
        <div className="py-12 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#F5922A]" />
          <p className="text-[#666]">AI 正在根據您的回答生成公文內容...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-[#1B2D6B] flex items-center gap-2">
        <MessageCircleQuestion className="h-5 w-5 text-[#F5922A]" />
        補充資訊
        {round > 0 && (
          <Badge variant="outline" className="ml-2 text-xs bg-[#F5F1EC] text-[#666] border-[#E1E1E1] rounded-md">
            第 {round + 1} 輪
          </Badge>
        )}
      </h2>
      <p className="text-sm text-[#666] mt-1 mb-5">
        AI 需要一些額外資訊來撰寫更精確的公文。請回答以下問題：
      </p>

      <div className="space-y-1">
          {/* Question tabs */}
          <div className="flex gap-1 mb-4 border-b border-[#E1E1E1] overflow-x-auto flex-nowrap whitespace-nowrap">
            {questions.map((q, i) => (
              <button
                key={q.field_key}
                onClick={() => setActiveQ(i)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  i === activeQ
                    ? "border-[#F5922A] text-[#F5922A]"
                    : answers[q.field_key]
                    ? "border-transparent text-[#222]"
                    : "border-transparent text-[#999]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {answers[q.field_key] && (
                    <Check className="h-3.5 w-3.5 text-[#419F83]" />
                  )}
                  {q.header}
                </span>
              </button>
            ))}
            {/* 其他補充 tab */}
            <button
              onClick={() => setActiveQ(questions.length)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeQ === questions.length
                  ? "border-[#F5922A] text-[#F5922A]"
                  : additionalNotes.trim()
                  ? "border-transparent text-[#222]"
                  : "border-transparent text-[#999]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {additionalNotes.trim() && (
                  <Check className="h-3.5 w-3.5 text-[#419F83]" />
                )}
                其他補充
              </span>
            </button>
          </div>

          {/* Active question */}
          {questions[activeQ] && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#222]">
                {questions[activeQ].question}
              </p>

              {/* Options */}
              <div className="space-y-2">
                {questions[activeQ].options.map((opt) => {
                  const isSelected = answers[questions[activeQ].field_key] === opt.label
                  return (
                    <button
                      key={opt.label}
                      onClick={() => selectOption(questions[activeQ].field_key, opt.label)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? "border-[#F5922A] bg-[#F5922A]/5 ring-1 ring-[#F5922A]/20"
                          : "border-[#E1E1E1] hover:border-[#F5922A]/40 hover:bg-[#F5F1EC]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-medium text-[#222]">{opt.label}</span>
                          <p className="text-xs text-[#999] mt-0.5">
                            {opt.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-[#F5922A] shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  )
                })}

                {/* Inline custom input */}
                <div className="flex gap-2 mt-1">
                  <Input
                    value={customInputs[questions[activeQ].field_key] ?? ""}
                    onChange={(e) =>
                      setCustomInputs((prev) => ({
                        ...prev,
                        [questions[activeQ].field_key]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        confirmCustom(questions[activeQ].field_key)
                      }
                    }}
                    placeholder="或自行輸入..."
                    className="text-sm rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                  />
                  {customInputs[questions[activeQ].field_key]?.trim() && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => confirmCustom(questions[activeQ].field_key)}
                      className="border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium"
                    >
                      確認
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#999]">
                按 Tab 切換選項
              </p>
            </div>
          )}

          {/* 其他補充 panel */}
          {activeQ === questions.length && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#222]">
                還有什麼想要補充的嗎？（選填）
              </p>
              <Textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="例如：特殊要求、額外背景資訊、想要強調的重點..."
                rows={3}
                className="resize-none text-sm rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
              />
            </div>
          )}
      </div>

      {/* Answered summary */}
      {Object.keys(answers).length > 0 && (
        <>
          <hr className="border-[#E1E1E1] my-6" />
          <div className="bg-white/60 rounded-lg p-3 border border-[#E1E1E1]">
            <div className="space-y-1.5">
              {questions.map((q) =>
                answers[q.field_key] ? (
                  <div key={q.field_key} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-[#419F83] shrink-0" />
                    <span className="text-[#666]">{q.header}：</span>
                    <span className="font-medium text-[#222]">{answers[q.field_key]}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="text-sm text-[#D5705D] bg-[#D5705D]/5 border border-[#D5705D]/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={!allAnswered}
          className="w-full sm:w-auto bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full font-medium order-first sm:order-last"
        >
          <ChevronRight className="h-4 w-4" />
          生成公文內容
        </Button>
        <Button variant="outline" onClick={onSkip} className="w-full sm:w-auto border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium">
          跳過，手動填寫
        </Button>
        <div className="hidden sm:block flex-1" />
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium sm:order-first">
          返回上一步
        </Button>
      </div>
    </div>
  )
}
