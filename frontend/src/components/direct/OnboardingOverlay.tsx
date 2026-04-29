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
