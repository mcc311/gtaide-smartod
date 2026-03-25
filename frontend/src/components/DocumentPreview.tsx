import { useEffect, useRef, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, AlertTriangle, FileText } from "lucide-react"
import type { GenerateRequest, GenerateResponse, IntentResult } from "@/types"

interface DocumentPreviewProps {
  intent: IntentResult
  form: GenerateRequest
}

export default function DocumentPreview({
  intent,
  form,
}: DocumentPreviewProps) {
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generate = useCallback(async () => {
    if (!intent.sender || !intent.receiver || !form.subject_detail) return
    setLoading(true)
    try {
      const body: GenerateRequest = { ...form, intent }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = (await res.json()) as GenerateResponse
        setResult(data)
      }
    } catch {
      // API not available
    } finally {
      setLoading(false)
    }
  }, [intent, form])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(generate, 800)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [generate])

  const handleCopy = async () => {
    if (!result?.rendered) return
    await navigator.clipboard.writeText(result.rendered)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="sticky top-4 flex flex-col max-h-[calc(100vh-2rem)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            公文預覽
          </CardTitle>
          <div className="flex items-center gap-2">
            {result?.doc_type && (
              <Badge variant="outline">{result.doc_type}</Badge>
            )}
            {result?.direction && (
              <Badge
                variant="outline"
                className={
                  result.direction === "上行文"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : result.direction === "下行文"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                }
              >
                {result.direction}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="animate-pulse">產生中...</div>
          </div>
        )}

        {!loading && !result && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2">
            <FileText className="h-12 w-12 opacity-30" />
            <p className="text-sm">填寫左方表單後，公文將自動產生於此</p>
          </div>
        )}

        {!loading && result?.rendered && (
          <div
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            style={{ fontFamily: '"Noto Sans TC", monospace' }}
          >
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
              {result.rendered}
            </pre>
          </div>
        )}

        {result?.phrases_used &&
          Object.keys(result.phrases_used).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                使用的用語：
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(result.phrases_used).map(([key, val]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}：{val}
                  </Badge>
                ))}
              </div>
            </div>
          )}
      </CardContent>

      {result?.validation_warnings &&
        result.validation_warnings.length > 0 && (
          <>
            <Separator />
            <div className="p-4 space-y-1.5">
              {result.validation_warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 rounded-md px-3 py-2"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </>
        )}

      <Separator />

      <CardFooter className="p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleCopy}
          disabled={!result?.rendered}
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
      </CardFooter>
    </Card>
  )
}
