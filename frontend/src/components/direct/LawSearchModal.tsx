import { X } from "lucide-react"
import Step3LawSuggestion from "@/components/Step3LawSuggestion"
import type { SelectedLaw, LawSuggestion } from "./directTypes"

interface LawSearchModalProps {
  open: boolean
  onClose: () => void
  initialSuggestions: LawSuggestion[]
  onSave: (selected: SelectedLaw[]) => void
}

export default function LawSearchModal({ open, onClose, initialSuggestions, onSave }: LawSearchModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-stretch justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E1E1E1]">
          <h2 className="text-base font-semibold text-[#1B2D6B]">法規瀏覽 / 搜尋</h2>
          <button type="button" className="text-[#999] hover:text-[#1B2D6B] p-1" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Step3LawSuggestion
            suggestions={initialSuggestions}
            onNext={(selected) => {
              onSave(selected)
              onClose()
            }}
            onBack={onClose}
            onSkip={onClose}
          />
        </div>
      </div>
    </div>
  )
}
