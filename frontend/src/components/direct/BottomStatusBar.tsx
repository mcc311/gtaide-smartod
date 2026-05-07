import { AlertTriangle, Check } from "lucide-react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"

interface BottomStatusBarProps {
  hook: UseDirectDocStateReturn
}

export default function BottomStatusBar({ hook }: BottomStatusBarProps) {
  const { state, mergedIntent } = hook
  if (state.phase === "onboarding" || state.phase === "parsing") {
    return <footer className="border-t border-[#E1E1E1] bg-white shrink-0 h-11" />
  }

  const isBulletin = state.docType === "公告"
  const isSign = state.docType === "簽" || state.docType === "便簽"
  const requiresReceiver = !isBulletin && !isSign
  const completed = [
    !!mergedIntent?.sender,
    !requiresReceiver || !!mergedIntent?.receiver,
    !!state.subject_detail,
    state.explanation_items.filter(Boolean).length > 0 ||
      state.docType === "開會通知單",
    state.action_items.filter(Boolean).length > 0 ||
      state.docType === "開會通知單" ||
      state.docType === "令",
    !!state.doc_number,
  ].filter(Boolean).length
  const pct = Math.round((completed / 6) * 100)

  const warnings: string[] = []
  if (!state.subject_detail) warnings.push("缺少主旨")
  if (
    state.docType !== "開會通知單" &&
    state.explanation_items.filter(Boolean).length === 0
  ) {
    warnings.push(state.docType === "公告" ? "缺少依據" : "缺少說明")
  }
  if (!state.doc_number) warnings.push("缺少發文字號")

  return (
    <footer className="border-t border-[#E1E1E1] bg-white shrink-0 px-4 py-2 flex items-center gap-4 text-xs h-11 overflow-hidden">
      <div className="flex items-center gap-2 min-w-[180px]">
        <div className="h-1.5 w-24 bg-[#E1E1E1] rounded-full overflow-hidden">
          <div className="h-full bg-[#F5922A]" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[#666]">完成度 {pct}% · {completed}/6</span>
      </div>
      <div className="flex-1 flex items-center gap-2 overflow-hidden">
        {warnings.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-[#065F46]">
            <Check className="h-3 w-3" /> 所有必填欄位已完成
          </span>
        ) : (
          warnings.map((w) => (
            <span key={w} className="inline-flex items-center gap-1 text-[#9A3412] truncate">
              <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
            </span>
          ))
        )}
      </div>
      <div className="hidden md:flex items-center gap-1 text-[#666] truncate">
        <span>{mergedIntent?.sender || "—"}</span>
        <span>·</span>
        <span>{mergedIntent?.subtype || "—"}</span>
        <span>·</span>
        <span>{state.phrases?.direction || "—"}</span>
      </div>
      <span className="hidden lg:inline text-[#999] text-[10px] ml-auto">
        操作紀錄會被匿名記錄以改善服務
      </span>
    </footer>
  )
}
