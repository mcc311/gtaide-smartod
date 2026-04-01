import { useEffect, useCallback } from "react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TagInput } from "@/components/ui/tag-input"
import { Sparkles, PenLine } from "lucide-react"
import OrganSelector from "@/components/OrganSelector"
import DocTypeSelector from "@/components/DocTypeSelector"
import type { OrganSelectInfo } from "@/components/OrganSelector"
import type {} from "@/types"
import type {
  DocType,
  IntentResult,
  PhraseResult,
  OrganNode,
  ReceiverType,
} from "@/types"

interface Step2IntentProps {
  intent: IntentResult
  onIntentChange: (intent: IntentResult) => void
  phraseResult: PhraseResult | null
  onPhraseResultChange: (result: PhraseResult | null) => void
  organTree: OrganNode[]
  docType: DocType | null
  onDocTypeOverride: (dt: DocType) => void
  onGenerate: () => void
  onManual: () => void
  loading?: boolean
}

export default function Step2Intent({
  intent,
  onIntentChange,
  phraseResult,
  onPhraseResultChange,
  organTree,
  docType,
  onDocTypeOverride,
  onGenerate,
  onManual,
  loading: _loading = false,
}: Step2IntentProps) {
  void _loading // used for future loading state display
  const fetchPhrases = useCallback(
    async (current: IntentResult) => {
      if (!current.sender || !current.receiver) {
        onPhraseResultChange(null)
        return
      }
      try {
        const res = await fetch("/api/get-phrases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: current.sender,
            receiver: current.receiver,
            action_type: current.action_type,
            receiver_type: current.receiver_type,
            sender_level: current.sender_level,
            receiver_level: current.receiver_level,
            sender_parent: current.sender_parent,
            receiver_parent: current.receiver_parent,
            subtype: current.subtype,
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as PhraseResult
          onPhraseResultChange(data)
        }
      } catch {
        // API not available
      }
    },
    [onPhraseResultChange]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPhrases(intent)
    }, 500)
    return () => clearTimeout(timer)
  }, [
    intent.sender,
    intent.receiver,
    intent.receiver_type,
    intent.action_type,
    intent.sender_level,
    intent.receiver_level,
    intent.sender_parent,
    intent.receiver_parent,
    fetchPhrases,
  ])

  const updateField = <K extends keyof IntentResult>(
    key: K,
    value: IntentResult[K]
  ) => {
    onIntentChange({ ...intent, [key]: value })
  }

  const handleSenderChange = (info: OrganSelectInfo) => {
    onIntentChange({
      ...intent,
      sender: info.name,
      sender_level: info.level ?? 0,
      sender_parent: info.parentContext ?? "",
    })
  }

  const handleReceiverChange = (info: OrganSelectInfo) => {
    const rt: ReceiverType = info.receiverType
      ? (info.receiverType as ReceiverType)
      : "政府機關"
    if (info.isCustom) {
      // Custom entry: name goes to display_name, receiver is the type category
      onIntentChange({
        ...intent,
        receiver: rt,
        receiver_type: rt,
        receiver_level: 0,
        receiver_parent: "",
        receiver_display_name: info.name,
      })
    } else {
      onIntentChange({
        ...intent,
        receiver: info.name,
        receiver_type: rt,
        receiver_level: info.level ?? 0,
        receiver_parent: info.parentContext ?? "",
        receiver_display_name: "",
      })
    }
  }

  const directionColor = (dir: string) => {
    if (dir === "上行文") return "bg-[#FEE2E2] text-[#991B1B] border-[#FEE2E2]"
    if (dir === "下行文") return "bg-[#D1FAE5] text-[#065F46] border-[#D1FAE5]"
    return "bg-[#DBEAFE] text-[#1E40AF] border-[#DBEAFE]"
  }

  const handleNext = () => {
    onGenerate()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-[#1B2D6B] flex items-center gap-2">
        確認發文意圖
      </h2>
      <p className="text-sm text-[#666] mt-1 mb-5">
        請確認以下欄位是否正確，可自行修改後再繼續。
      </p>

      <div className="space-y-4">
          {/* Sender + Receiver row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[#222] font-medium text-sm">發文機關</Label>
              <OrganSelector
                label="發文機關"
                value={intent.sender}
                onChange={handleSenderChange}
                organTree={organTree}
                placeholder="例：教育部"
              />
              {intent.sender_parent && (
                <div className="text-xs text-[#999] pl-1">{intent.sender_parent} &gt; {intent.sender}</div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[#222] font-medium text-sm">受文機關</Label>
              <OrganSelector
                label="受文者"
                value={intent.receiver}
                onChange={handleReceiverChange}
                organTree={organTree}
                placeholder="例：國立臺灣大學"
              />
              {intent.receiver_parent && (
                <div className="text-xs text-[#999] pl-1">{intent.receiver_parent} &gt; {intent.receiver}</div>
              )}
            </div>
          </div>

          {/* Direction badges — right after sender/receiver */}
          <div className="flex items-center gap-3 flex-wrap">
            {phraseResult && (
              <Badge variant="outline" className={directionColor(phraseResult.direction)}>
                {phraseResult.direction}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={
                intent.is_internal
                  ? "bg-[#F5F1EC] text-[#666] border-[#E1E1E1] rounded-md"
                  : "bg-[#DBEAFE] text-[#1E40AF] border-[#DBEAFE] rounded-md"
              }
            >
              {intent.is_internal ? "內部行文" : "對外行文"}
            </Badge>
          </div>


          {/* Doc type + Subtype selector */}
          <div className="space-y-2">
            <Label className="text-[#222] font-medium text-sm">公文類型</Label>
            <DocTypeSelector
              docType={docType}
              subtype={intent.subtype}
              onSelect={(dt, st) => {
                onDocTypeOverride(dt)
                updateField("subtype", st)
              }}
            />
            {intent.confident === false && intent.reasoning && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/20 text-sm">
                <span className="shrink-0 mt-0.5">💡</span>
                <div className="text-[#92400E]">
                  <span className="font-medium">AI 判斷為「{docType}{intent.subtype ? ` / ${intent.subtype}` : ""}」，但不太確定</span>
                  <p className="mt-0.5 text-xs text-[#A16207]">{intent.reasoning}</p>
                </div>
              </div>
            )}
          </div>


          <Separator className="bg-[#E1E1E1]" />

          {/* Subject brief */}
          <div className="space-y-2">
            <Label className="text-[#222] font-medium text-sm">主旨摘要</Label>
            <Input
              value={intent.subject_brief}
              onChange={(e) => updateField("subject_brief", e.target.value)}
              placeholder="簡述公文目的"
              className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
            />
          </div>

          {/* Reference doc */}
          <div className="space-y-2">
            <Label className="text-[#222] font-medium text-sm">引述來文字號（選填）</Label>
            <Input
              value={intent.reference_doc ?? ""}
              onChange={(e) => updateField("reference_doc", e.target.value || undefined)}
              placeholder="例：台教高(一)字第1120000000號"
              className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-[#222] font-medium text-sm">附件（選填）</Label>
            <TagInput
              value={intent.attachments}
              onChange={(tags) => updateField("attachments", tags)}
              placeholder="輸入附件名稱後按 Enter、逗號或頓號新增"
            />
          </div>

          {/* Formality */}
          <div className="flex items-center gap-2">
            <Label className="shrink-0 text-[#222] font-medium text-sm">正式程度：</Label>
            <Badge
              variant="outline"
              className={
                intent.formality === "正式"
                  ? "bg-[#F5F1EC] text-[#666] border-[#E1E1E1] rounded-md"
                  : "bg-[#F5922A]/10 text-[#F5922A] border-[#F5922A]/30 rounded-md"
              }
            >
              {intent.formality}
            </Badge>
          </div>

          {/* Auto-selected phrases */}
          {phraseResult && (
            <>
              <Separator className="bg-[#E1E1E1]" />
              <div className="space-y-2">
                <Label className="text-[#222] font-medium text-sm">自動選用公文用語</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1.5 text-sm">
                  {Object.entries(phraseResult.phrases)
                    .filter(([key]) => !["行文性質", "期望語", "開頭語"].includes(key))
                    .map(([key, val]) => (
                      <div key={key} className="flex items-center gap-1">
                        <span className="text-[#999] text-xs shrink-0">{key}</span>
                        <span className="text-[#222]">{val || "—"}</span>
                      </div>
                    ))}
                  {phraseResult.opening && (
                    <div className="flex items-center gap-1">
                      <span className="text-[#999] text-xs shrink-0">開頭語</span>
                      <span className="text-[#222]">{phraseResult.opening}</span>
                    </div>
                  )}
                  {phraseResult.expectation && (
                    <div className="flex items-center gap-1">
                      <span className="text-[#999] text-xs shrink-0">期望語</span>
                      <span className="text-[#222]">{phraseResult.expectation}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={handleNext}
          disabled={!intent.sender || !intent.receiver}
          className="w-full sm:w-auto sm:flex-1 bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full font-medium"
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          下一步：AI 補充資訊
        </Button>
        <Button
          variant="outline"
          onClick={onManual}
          size="lg"
          className="w-full sm:w-auto border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium"
        >
          <PenLine className="h-4 w-4" />
          手動填寫
        </Button>
      </div>
    </div>
  )
}
