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
