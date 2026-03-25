import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, MessageCircle, ChevronRight, ChevronLeft } from "lucide-react"

interface Step2FollowupProps {
  userInput: string
  onComplete: (questions: string[], answers: string[]) => void
  onBack: () => void
  onSkip: () => void
}

export default function Step2Followup({
  userInput,
  onComplete,
  onBack,
  onSkip,
}: Step2FollowupProps) {
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchQuestions() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_input: userInput }),
        })
        if (cancelled) return
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const qs = data.questions ?? []
        setQuestions(qs)
        setAnswers(new Array(qs.length).fill(""))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "載入失敗")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchQuestions()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateAnswer = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const allAnswered = answers.every((a) => a.trim().length > 0)

  const handleSubmit = () => {
    onComplete(questions, answers)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">AI 正在分析您的需求，準備追問細節...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* User's original input */}
      <Card className="bg-muted/30">
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground mb-1">您的需求：</p>
          <p className="text-sm">{userInput}</p>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            請補充以下細節
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            回答越詳細，生成的公文越精確。不確定的可以留空。
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {questions.map((q, i) => (
            <div key={i} className="space-y-2">
              <Label className="text-sm font-medium">
                {i + 1}. {q}
              </Label>
              <Textarea
                value={answers[i]}
                onChange={(e) => updateAnswer(i, e.target.value)}
                placeholder="請輸入..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          返回上一步
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={onSkip}>
          跳過
        </Button>
        <Button onClick={handleSubmit} disabled={!allAnswered}>
          <ChevronRight className="h-4 w-4" />
          確認，下一步
        </Button>
      </div>
    </div>
  )
}
