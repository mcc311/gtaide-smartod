import { useState } from "react"
import { Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UseDirectDocStateReturn } from "./useDirectDocState"
import AiTabSuggestions from "./AiTabSuggestions"
import AiTabLaws from "./AiTabLaws"
import AiTabChat from "./AiTabChat"

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
        {tab === "chat" && <AiTabChat hook={hook} />}
        {tab === "suggestions" && <AiTabSuggestions hook={hook} />}
        {tab === "laws" && <AiTabLaws hook={hook} onOpenSearch={onOpenLawSearch} />}
      </div>
    </aside>
  )
}
