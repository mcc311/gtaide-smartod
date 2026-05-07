import { useState, useEffect, useMemo } from "react"
import { Send, Loader2 } from "lucide-react"
import { EXAMPLES } from "./constants"
import OrganSelector from "@/components/OrganSelector"
import type { OrganSelectInfo } from "@/components/OrganSelector"
import type { OrganNode } from "@/types"

interface OnboardingOverlayProps {
  onSubmit: (text: string, sender: OrganSelectInfo) => void | Promise<void>
  onBlank: () => void
  loading: boolean
  organTree: OrganNode[]
}

export default function OnboardingOverlay({ onSubmit, onBlank, loading, organTree }: OnboardingOverlayProps) {
  const [text, setText] = useState("")
  const [sender, setSender] = useState<OrganSelectInfo | null>(null)

  // Default sender: 國科會 (first user cohort). Auto-applied when organ tree loads
  // and user hasn't manually picked yet.
  const nstcDefault = useMemo<OrganSelectInfo | null>(() => {
    function find(nodes: OrganNode[], path: string[] = []): OrganSelectInfo | null {
      for (const n of nodes) {
        if (n.name === "國家科學及技術委員會") {
          return {
            name: n.name,
            receiverType: n.receiver_type,
            level: n.level ?? path.length,
            parentContext: path.join(" > "),
            isCustom: false,
          }
        }
        const found = find(n.children, [...path, n.name])
        if (found) return found
      }
      return null
    }
    return find(organTree)
  }, [organTree])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nstcDefault && !sender) setSender(nstcDefault)
  }, [nstcDefault, sender])

  const canSubmit = !!sender && !!text.trim() && !loading

  const handleSubmit = () => {
    if (canSubmit && sender) onSubmit(text, sender)
  }

  return (
    <div className="absolute inset-0 z-30 bg-[#F5F1EC]/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-[#E1E1E1] p-8 my-auto">
        <div className="flex items-center gap-2 text-xs text-[#666] uppercase tracking-wider">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#F5922A] animate-pulse" />
          開始撰寫公文
        </div>
        <h1 className="mt-3 text-3xl font-bold text-[#1B2D6B]">直接在公文紙上撰寫</h1>
        <p className="mt-2 text-sm text-[#666]">
          先告訴我您的單位，再用一句話描述要發的公文。AI 會準確判斷對內或對外。
        </p>

        {/* Sender selection */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-[#222] mb-2">
            <span className="text-[#D5705D] mr-1">*</span>我是
          </label>
          <div className="border border-[#E1E1E1] rounded-lg px-3 py-2 hover:border-[#1B2D6B] transition-colors">
            <OrganSelector
              label="發文機關"
              value={sender?.name ?? ""}
              onChange={(info) => setSender(info)}
              organTree={organTree}
              placeholder="點此選擇您的單位..."
            />
          </div>
          {sender?.parentContext && (
            <div className="mt-1 text-xs text-[#999]">{sender.parentContext} &gt; {sender.name}</div>
          )}
        </div>

        {/* Description textarea */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-[#222] mb-2">
            <span className="text-[#D5705D] mr-1">*</span>要發的公文
          </label>
          <textarea
            className="w-full h-24 rounded-lg border border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-1 focus:ring-[#1B2D6B]/20 px-3 py-2 text-sm resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="用一句話描述您要發的公文..."
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-[#999]">⌘+Enter 送出</div>
            <button
              type="button"
              className="inline-flex items-center gap-1 bg-[#F5922A] hover:bg-[#D47B22] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full px-4 py-2 text-sm font-medium"
              onClick={handleSubmit}
              disabled={!canSubmit}
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

        <div className="mt-5 pt-3 border-t border-[#E1E1E1] text-xs text-[#666] leading-relaxed">
          <strong className="text-[#222]">隱私通知：</strong>
          您於本系統中輸入的公文描述、AI 對話內容、生成草稿與匯出結果，將以匿名識別碼（cookie）儲存供未來服務改善使用。
          請<strong className="text-[#9A3412]">避免輸入個人身分證字號、敏感個資或機密案件細節</strong>；測試請使用虛擬資料。
        </div>
      </div>
    </div>
  )
}
