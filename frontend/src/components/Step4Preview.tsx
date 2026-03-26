import { useEffect, useState, useCallback } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import {
  Copy,
  Check,
  AlertTriangle,
  FileText,
  ArrowLeft,
  RotateCcw,
  Loader2,
} from "lucide-react"
import type { GenerateRequest, GenerateResponse, IntentResult } from "@/types"

interface Step4PreviewProps {
  intent: IntentResult
  form: GenerateRequest
  onBackToEdit: () => void
  onRestart: () => void
}

export default function Step4Preview({
  intent,
  form,
  onBackToEdit,
  onRestart,
}: Step4PreviewProps) {
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const generate = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const body: GenerateRequest = { ...form, intent }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        throw new Error(`API 回應錯誤 (${res.status})`)
      }
      const data = (await res.json()) as GenerateResponse
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "產生公文失敗")
    } finally {
      setLoading(false)
    }
  }, [intent, form])

  useEffect(() => {
    generate()
  }, [generate])

  const handleCopy = async () => {
    if (!result?.rendered) return
    await navigator.clipboard.writeText(result.rendered)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const directionColor = (dir: string) => {
    if (dir === "上行文") return "bg-[#FEE2E2] text-[#991B1B] border-[#FEE2E2]"
    if (dir === "下行文") return "bg-[#D1FAE5] text-[#065F46] border-[#D1FAE5]"
    return "bg-[#DBEAFE] text-[#1E40AF] border-[#DBEAFE]"
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#1B2D6B] flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#F5922A]" />
          公文預覽
        </h2>
        <div className="flex items-center gap-2">
          {result?.doc_type && (
            <Badge variant="outline" className="bg-[#F5F1EC] text-[#666] border-[#E1E1E1] rounded-md">{result.doc_type}</Badge>
          )}
          {result?.direction && (
            <Badge
              variant="outline"
              className={directionColor(result.direction)}
            >
              {result.direction}
            </Badge>
          )}
        </div>
      </div>

      <hr className="border-[#E1E1E1] my-4" />

      <div className="space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-[#666] space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#F5922A]" />
              <p className="text-sm">正在產生公文...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-sm text-[#D5705D] bg-[#D5705D]/5 border border-[#D5705D]/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {!loading && !error && !result && (
            <div className="flex flex-col items-center justify-center py-16 text-[#666] space-y-2">
              <FileText className="h-12 w-12 opacity-30" />
              <p className="text-sm">無法產生預覽</p>
            </div>
          )}

          {!loading && result?.rendered && (
            <div
              className="bg-white border border-[#d1d1d1] rounded-lg p-5 sm:p-8 mx-auto"
              style={{
                fontFamily: "'Noto Serif TC', serif",
                maxWidth: "640px",
              }}
            >
              <pre className="whitespace-pre-wrap text-sm sm:text-[15px] leading-[1.8] tracking-[0.03em] text-[#222]">
                {result.rendered}
              </pre>
            </div>
          )}

          {result?.phrases_used &&
            Object.keys(result.phrases_used).length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-xs text-[#999] font-medium">
                  使用的用語：
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(result.phrases_used).map(([key, val]) => (
                    <Badge key={key} variant="secondary" className="text-xs bg-[#F5F1EC] text-[#666] rounded-md">
                      {key}：{val}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
      </div>

      {/* Validation warnings */}
      {result?.validation_warnings &&
        result.validation_warnings.length > 0 && (
          <>
            <hr className="border-[#E1E1E1] my-4" />
            <div className="space-y-1.5">
              {result.validation_warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-[#F5922A] bg-[#F5922A]/5 rounded-lg px-3 py-2"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </>
        )}

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
        <Button
          onClick={handleCopy}
          disabled={!result?.rendered}
          className="w-full sm:w-auto bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full font-medium order-first sm:order-last"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              已複製
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              複製公文內容
            </>
          )}
        </Button>
        <div className="hidden sm:block flex-1" />
        <Button variant="outline" onClick={onBackToEdit} className="w-full sm:w-auto border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium">
          <ArrowLeft className="h-4 w-4" />
          返回編輯
        </Button>
        <Button variant="outline" onClick={onRestart} className="w-full sm:w-auto border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium">
          <RotateCcw className="h-4 w-4" />
          重新開始
        </Button>
      </div>
    </div>
  )
}
