import { X } from "lucide-react"
import Step4Preview from "@/components/Step4Preview"
import type { IntentResult, GenerateRequest } from "@/types"

interface ExportModalProps {
  open: boolean
  onClose: () => void
  intent: IntentResult
  form: GenerateRequest
}

export default function ExportModal({ open, onClose, intent, form }: ExportModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-stretch justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E1E1E1]">
          <h2 className="text-base font-semibold text-[#1B2D6B]">預覽 / 匯出公文</h2>
          <button type="button" className="text-[#999] hover:text-[#1B2D6B] p-1" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Step4Preview
            intent={intent}
            form={form}
            onBackToEdit={onClose}
            onRestart={onClose}
          />
        </div>
      </div>
    </div>
  )
}
