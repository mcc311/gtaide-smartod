interface PlaceholderBlockProps {
  unansweredCount: number
}

export default function PlaceholderBlock({ unansweredCount }: PlaceholderBlockProps) {
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
