import { Loader2 } from "lucide-react"

interface PlaceholderBlockProps {
  unansweredCount: number
  generating?: boolean
}

export default function PlaceholderBlock({ unansweredCount, generating }: PlaceholderBlockProps) {
  if (generating) {
    return (
      <div className="border-2 border-dashed border-[#F5922A]/40 rounded-md px-4 py-6 text-center bg-[#FFF4E0] animate-pulse">
        <div className="text-sm text-[#9A3412] inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          AI 正在生成中…
        </div>
      </div>
    )
  }
  return (
    <div className="border-2 border-dashed border-[#E1E1E1] rounded-md px-4 py-6 text-center bg-[#FAF9F6]">
      <div className="text-sm text-[#999]">
        待補充
        {unansweredCount > 0 && (
          <span className="text-[#F5922A] font-medium">
            {" "}
            · 請於右側完成 {unansweredCount} 個釐清問題
          </span>
        )}
      </div>
    </div>
  )
}
