import { Loader2, Send } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"
import type { DirectDocState } from "./directTypes"
import type { IntentResult } from "@/types"

interface AiTabChatProps {
  hook: UseDirectDocStateReturn
}

const QUICK_QUESTIONS = [
  "這個主旨可以更精簡嗎？",
  "把第二段改成正式語氣",
  "加上罰則段落",
]

interface Edit {
  field: string
  value: string | string[]
}

const SCALAR_FIELDS = new Set([
  "subject_detail",
  "doc_date",
  "doc_number",
  "speed",
  "attachments_text",
  "meeting_time",
  "meeting_place",
  "meeting_chair",
  "meeting_contact",
  "meeting_contact_phone",
  "meeting_notes",
])
const ARRAY_FIELDS = new Set([
  "explanation_items",
  "action_items",
  "recipients_main",
  "recipients_cc",
  "meeting_attendees",
  "meeting_observers",
  "attachments",
])

function buildChatEditPayload(
  state: DirectDocState,
  mergedIntent: IntentResult | null,
  userMessage: string
) {
  return {
    intent: mergedIntent
      ? {
          sender: mergedIntent.sender,
          receiver: mergedIntent.receiver,
          receiver_type: mergedIntent.receiver_type,
          action_type: mergedIntent.action_type,
          purpose: mergedIntent.purpose,
          subject_brief: mergedIntent.subject_brief,
          reference_doc: mergedIntent.reference_doc ?? "",
          attachments: mergedIntent.attachments,
          receiver_display_name: mergedIntent.receiver_display_name,
        }
      : {},
    phrases: state.phrases?.phrases ?? {},
    doc_type: state.docType,
    direction: state.phrases?.direction ?? "平行文",
    subtype: mergedIntent?.subtype ?? "",
    subject_detail: state.subject_detail,
    explanation_items: state.explanation_items,
    action_items: state.action_items,
    doc_date: state.doc_date,
    doc_number: state.doc_number,
    speed: state.speed,
    attachments_text: state.attachments.join("、"),
    recipients_main: state.recipients_main,
    recipients_cc: state.recipients_cc,
    meeting_time: state.meeting_time,
    meeting_place: state.meeting_place,
    meeting_chair: state.meeting_chair,
    meeting_contact: state.meeting_contact,
    meeting_contact_phone: state.meeting_contact_phone,
    meeting_attendees: state.meeting_attendees,
    meeting_observers: state.meeting_observers,
    meeting_notes: state.meeting_notes,
    chat_history: state.chatHistory,
    user_message: userMessage,
  }
}

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
    if (SCALAR_FIELDS.has(edit.field) && typeof edit.value === "string") {
      hook.update({ [edit.field]: edit.value } as Partial<DirectDocState>, edit.field)
    } else if (ARRAY_FIELDS.has(edit.field) && Array.isArray(edit.value)) {
      hook.update({ [edit.field]: edit.value } as Partial<DirectDocState>, edit.field)
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
        body: JSON.stringify(
          buildChatEditPayload(hook.state, hook.mergedIntent, trimmed)
        ),
      })
      if (!res.ok) throw new Error(`chat-edit ${res.status}`)
      const data: {
        edits: Edit[]
        assistant_message: string
        pending_question?: { question: string; options?: string[] } | null
      } = await res.json()
      for (const edit of data.edits ?? []) applyEdit(edit)
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
              {m.role === "assistant" && m.options && m.options.length > 0 && (
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
          {QUICK_QUESTIONS.map((q) => (
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
