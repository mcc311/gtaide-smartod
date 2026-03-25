import { useEffect, useCallback } from "react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TagInput } from "@/components/ui/tag-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, PenLine } from "lucide-react"
import OrganSelector from "@/components/OrganSelector"
import type { OrganSelectInfo } from "@/components/OrganSelector"
import type {
  ActionType,
  DocType,
  IntentResult,
  PhraseResult,
  OrganNode,
  ReceiverType,
} from "@/types"

const ACTION_TYPES: ActionType[] = [
  "新案", "復函", "轉函", "檢送文件", "會議通知", "公布法令", "人事命令", "報告",
]

const DOC_TYPES: DocType[] = [
  "函", "書函", "簽", "便簽", "公告", "令", "開會通知單",
]

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
    onIntentChange({
      ...intent,
      receiver: info.name,
      receiver_type: rt,
      receiver_level: info.level ?? 0,
      receiver_parent: info.parentContext ?? "",
      receiver_display_name: "",
    })
  }

  const directionColor = (dir: string) => {
    if (dir === "上行文") return "bg-[#FEE2E2] text-[#991B1B] border-[#FEE2E2]"
    if (dir === "下行文") return "bg-[#D1FAE5] text-[#065F46] border-[#D1FAE5]"
    return "bg-[#DBEAFE] text-[#1E40AF] border-[#DBEAFE]"
  }

  const receiverNameConfig: Record<string, { label: string; placeholder: string }> = {
    "人民": { label: "受文者姓名", placeholder: "例：王小明" },
    "企業/公司": { label: "公司名稱", placeholder: "例：台積電股份有限公司" },
    "團體/協會": { label: "團體名稱", placeholder: "例：中華民國工商協進會" },
    "學校": { label: "學校名稱", placeholder: "例：國立臺灣大學" },
  }

  const showDisplayNameInput = intent.receiver_type in receiverNameConfig
  const displayNameInfo = receiverNameConfig[intent.receiver_type]

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
          {/* Sender */}
          <div className="space-y-2">
            <Label className="text-[#222] font-medium text-sm">發文機關</Label>
            <OrganSelector
              label="發文機關"
              value={intent.sender}
              onChange={handleSenderChange}
              organTree={organTree}
              placeholder="例：教育部"
            />
          </div>

          {/* Receiver */}
          <div className="space-y-2">
            <Label className="text-[#222] font-medium text-sm">受文機關</Label>
            <OrganSelector
              label="受文者"
              value={intent.receiver}
              onChange={handleReceiverChange}
              organTree={organTree}
              placeholder="例：國立臺灣大學"
            />
          </div>

          {/* Receiver type badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="shrink-0 text-[#222] font-medium text-sm">受文者類型：</Label>
            <Select
              value={intent.receiver_type}
              onValueChange={(v) => updateField("receiver_type", v as ReceiverType)}
            >
              <SelectTrigger className="w-auto h-8 text-xs rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["政府機關", "人民", "企業/公司", "團體/協會", "學校", "公眾", "自訂"].map((rt) => (
                  <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Display name for non-gov */}
          {showDisplayNameInput && displayNameInfo && (
            <div className="space-y-2">
              <Label className="text-[#222] font-medium text-sm">{displayNameInfo.label}</Label>
              <Input
                value={intent.receiver_display_name}
                onChange={(e) => updateField("receiver_display_name", e.target.value)}
                placeholder={displayNameInfo.placeholder}
                className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
              />
            </div>
          )}

          {/* Action type */}
          <div className="space-y-2">
            <Label className="text-[#222] font-medium text-sm">行文類型</Label>
            <Select
              value={intent.action_type}
              onValueChange={(v) => updateField("action_type", v as ActionType)}
            >
              <SelectTrigger className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10">
                <SelectValue placeholder="選擇行文類型" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doc type */}
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="shrink-0 text-[#222] font-medium text-sm">建議公文類型：</Label>
            {docType && (
              <Badge variant="outline" className="bg-[#F5922A]/10 text-[#F5922A] border-[#F5922A]/30 rounded-md">
                {docType}
              </Badge>
            )}
            <Select
              value={docType ?? ""}
              onValueChange={(v) => onDocTypeOverride(v as DocType)}
            >
              <SelectTrigger className="w-auto h-8 text-xs rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10">
                <SelectValue placeholder="變更類型" />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((dt) => (
                  <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Direction and internal/external badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {phraseResult && (
              <Badge variant="outline" className={directionColor(phraseResult.direction)}>
                行文方向：{phraseResult.direction}
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
              <div className="space-y-3">
                <Label className="text-[#222] font-medium text-sm">自動選用公文用語</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(phraseResult.phrases).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className="text-[#666] shrink-0">{key}：</span>
                      <Badge variant="secondary" className="text-xs bg-[#F5F1EC] text-[#666] rounded-md">{val}</Badge>
                    </div>
                  ))}
                </div>
                {phraseResult.opening && (
                  <div className="text-sm">
                    <span className="text-[#666]">開頭語：</span>
                    <span className="ml-1 text-[#222]">{phraseResult.opening}</span>
                  </div>
                )}
                {phraseResult.expectation && (
                  <div className="text-sm">
                    <span className="text-[#666]">期望語：</span>
                    <span className="ml-1 text-[#222]">{phraseResult.expectation}</span>
                  </div>
                )}
              </div>
            </>
          )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleNext}
          disabled={!intent.sender || !intent.receiver}
          className="flex-1 bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full font-medium"
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          下一步：AI 補充資訊
        </Button>
        <Button
          variant="outline"
          onClick={onManual}
          size="lg"
          className="border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium"
        >
          <PenLine className="h-4 w-4" />
          手動填寫
        </Button>
      </div>
    </div>
  )
}
