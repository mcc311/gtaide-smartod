import { Undo2, Send, Download, RefreshCw } from "lucide-react"

interface HeaderProps {
  canUndo: boolean
  onUndo: () => void
  onRestart: () => void
  onExport: () => void
}

export default function Header({ canUndo, onUndo, onRestart, onExport }: HeaderProps) {
  return (
    <header className="border-b border-[#E1E1E1] bg-white shrink-0 px-4 lg:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img src="/gtaide_logo.svg" alt="GTAIDE" className="h-7" />
        <div className="hidden sm:block h-5 w-px bg-[#E1E1E1]" />
        <span className="hidden sm:inline text-base font-semibold text-[#1B2D6B]">
          SmartOD <span className="text-[#666] font-normal">· 直接編輯版</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-xs text-[#666] mr-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#065F46] mr-1" />
          自動儲存中
        </span>
        <button
          type="button"
          className="p-2 rounded hover:bg-[#F5F1EC] text-[#666] disabled:opacity-30"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="復原"
          title="復原"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="p-2 rounded hover:bg-[#F5F1EC] text-[#666]"
          onClick={onRestart}
          aria-label="重新開始"
          title="重新開始"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-[#E1E1E1] hover:bg-[#F5F1EC] text-[#1B2D6B]"
          onClick={onExport}
        >
          <Download className="h-4 w-4" /> 匯出
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-[#F5922A] hover:bg-[#D47B22] text-white font-medium"
          onClick={onExport}
        >
          送出簽核 <Send className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
