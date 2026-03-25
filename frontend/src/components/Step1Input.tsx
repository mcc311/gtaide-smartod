import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, PenLine, FileText, Reply, Send } from "lucide-react"
import type { ParsedIntentResponse } from "@/types"

const EXAMPLES = [
  {
    icon: Send,
    title: "檢送文件",
    text: "我是國科會，要發函給教育部，檢送114年度科技計畫書請他們審查，附件有計畫書一份",
  },
  {
    icon: Reply,
    title: "回覆陳情",
    text: "我是勞動部，要回覆王小明的勞工職災補助申請，他的申請符合規定可以核准",
  },
  {
    icon: FileText,
    title: "內部簽呈",
    text: "我是經濟部商業發展署，要簽報經濟部，建議修正商業登記法施行細則第5條",
  },
]

interface Step1InputProps {
  onParsed: (result: ParsedIntentResponse) => void
  onSkip: () => void
}

export default function Step1Input({ onParsed, onSkip }: Step1InputProps) {
  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!userInput.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: userInput.trim() }),
      })
      if (!res.ok) throw new Error(`API 回應錯誤 (${res.status})`)
      const data = (await res.json()) as ParsedIntentResponse
      onParsed(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失敗，請稍後再試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-[#1B2D6B] flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#F5922A]" />
        AI 智慧分析
      </h2>
      <p className="text-sm text-[#666] mt-1 mb-5">
        用自然語言描述您要發的公文，AI 將自動解析發文意圖並填寫相關欄位。
      </p>

      {/* Example cards - always outside the form flow */}
      {!userInput && !loading && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.title}
              onClick={() => setUserInput(ex.text)}
              className="text-left p-3.5 rounded-lg border border-[#E1E1E1] hover:border-[#F5922A]/40 hover:bg-white transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <ex.icon className="h-4 w-4 text-[#999] group-hover:text-[#F5922A] transition-colors" />
                <span className="text-sm font-medium text-[#222]">{ex.title}</span>
              </div>
              <p className="text-xs text-[#888] line-clamp-3 leading-relaxed">
                {ex.text}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Form area - fixed width, doesn't shrink */}
      <div className="space-y-4">
        <Textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="描述您要發的公文..."
          rows={5}
          className="resize-none text-[15px] rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
          disabled={loading}
        />

        {error && (
          <div className="text-sm text-[#D5705D] bg-[#D5705D]/5 border border-[#D5705D]/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <Button
          onClick={handleAnalyze}
          disabled={!userInput.trim() || loading}
          className="flex-1 bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full h-11 text-sm font-medium"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 分析中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI 分析
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={loading}
          className="border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full h-11 text-sm font-medium"
          size="lg"
        >
          <PenLine className="h-4 w-4" />
          手動填寫
        </Button>
      </div>
    </div>
  )
}
