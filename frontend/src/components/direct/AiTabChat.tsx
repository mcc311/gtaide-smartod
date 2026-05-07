import { Loader2, Send } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"
import type { DirectDocState } from "./directTypes"
import { toChatEditPayload, applyEditToState, type Edit } from "./payload"

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
  const beforeParse =
    hook.state.phase === "onboarding" || hook.state.phase === "parsing"
  const history = hook.state.chatHistory
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history.length])

  const applyEdit = (edit: Edit) => {
    const valid = applyEditToState(edit, hook.state.fieldKinds)
    if (valid) {
      hook.update({ [valid.field]: valid.value } as Partial<DirectDocState>, valid.field)
    } else {
      console.warn("Unsupported edit:", edit)
    }
  }

  const [localSubmitting, setLocalSubmitting] = useState(false)
  const sendMessage = async (msg: string) => {
    const trimmed = msg.trim()
    if (!trimmed || submitting || localSubmitting || beforeParse) return
    setText("")
    setLocalSubmitting(true)
    hook.appendChat({ role: "user", content: trimmed })
    try {
      const res = await fetch("/api/chat-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          toChatEditPayload(hook.state, hook.mergedIntent, trimmed, hook.state.chatSessionId, hook.state.chatHistory)
        ),
      })
      if (!res.ok) throw new Error(`chat-edit ${res.status}`)
      const data: {
        edits: Edit[]
        assistant_message: string
        pending_question?: { question: string; options?: string[] } | null
        session_id: string
        suggested_followups?: string[] | null
      } = await res.json()
      for (const edit of data.edits ?? []) applyEdit(edit)
      if (data.session_id) {
        hook.update({ chatSessionId: data.session_id })
      }
      // Always refresh suggestedFollowups (independent of session_id presence) — null/missing → []
      hook.update({ suggestedFollowups: data.suggested_followups ?? [] })
      const replyContent = data.pending_question?.question ?? data.assistant_message ?? ""
      const replyOptions = data.pending_question?.options
      if (replyContent) {
        hook.appendChat({
          role: "assistant",
          content: replyContent,
          options: replyOptions,
        })
      }
    } catch (err) {
      console.error(err)
      hook.appendChat({
        role: "assistant",
        content: "（錯誤：無法連線至 chat-edit 服務）",
      })
    } finally {
      setLocalSubmitting(false)
    }
  }

  const handleSubmit = () => {
    void sendMessage(text)
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {history.length === 0 ? (
          <div className="text-sm text-[#666]">
            {beforeParse
              ? "請先在中央彈窗中描述要發的公文。完成 AI 分析後，可在此與 AI 助理對話、修改草稿。"
              : "AI 助理已就緒。可直接打字下指令。"}
          </div>
        ) : (
          history.map((m, i) => (
            <div key={i} className={m.role === "user" ? "ml-6" : "mr-6"}>
              <div
                className={
                  m.role === "user"
                    ? "bg-[#1B2D6B] text-white rounded-lg px-3 py-2 text-sm"
                    : "bg-[#F5F1EC] text-[#222] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap"
                }
              >
                {m.content}
              </div>
              {m.role === "assistant" &&
                m.options &&
                m.options.length > 0 &&
                i === history.length - 1 && (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {m.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className="text-xs px-2 py-1 rounded-full border border-[#E1E1E1] bg-white hover:border-[#1B2D6B] hover:bg-[#F5F1EC]"
                        onClick={() => {
                          if (submitting || beforeParse) return
                          void sendMessage(opt)
                        }}
                        disabled={submitting || beforeParse}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          ))
        )}
        {submitting && (
          <div className="mr-6 bg-[#F5F1EC] text-[#666] rounded-lg px-3 py-2 text-sm flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> AI 思考中...
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(hook.state.suggestedFollowups.length > 0 ? hook.state.suggestedFollowups : QUICK_QUESTIONS).map((q) => (
            <button
              key={q}
              type="button"
              className="text-xs px-2 py-1 rounded-full border border-[#E1E1E1] hover:border-[#1B2D6B]"
              onClick={() => setText(q)}
              disabled={submitting || beforeParse}
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
            disabled={submitting || beforeParse}
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
            disabled={!text.trim() || submitting || beforeParse}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <div className="text-xs text-[#999]">⌘+Enter 送出</div>
      </div>
    </div>
  )
}
