import { Loader2, Send } from "lucide-react"
import { useState, useRef, useEffect } from "react"
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
  const history = hook.state.chatHistory
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history.length])

  const handleSubmit = async () => {
    if (!text.trim()) return
    // v1 stub: backend chat-edit endpoint not yet wired (lands in Task 24).
    // For now, just push the user message and a placeholder assistant reply.
    hook.appendChat({ role: "user", content: text })
    hook.appendChat({
      role: "assistant",
      content: "（chat-edit 後端尚未串接，本次訊息暫不執行修改）",
    })
    setText("")
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {history.length === 0 ? (
          <div className="text-sm text-[#666]">
            先描述要發的公文，AI 將起草草稿。
          </div>
        ) : (
          history.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-6 bg-[#1B2D6B] text-white rounded-lg px-3 py-2 text-sm"
                  : "mr-6 bg-[#F5F1EC] text-[#222] rounded-lg px-3 py-2 text-sm"
              }
            >
              {m.content}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 space-y-2">
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void handleSubmit()
              }
            }}
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
        <div className="text-xs text-[#999]">⌘+Enter 送出</div>
      </div>
    </div>
  )
}
