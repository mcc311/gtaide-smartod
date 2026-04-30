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
