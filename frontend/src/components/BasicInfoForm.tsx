import { useEffect, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import OrganSelector from "@/components/OrganSelector"
import type { OrganSelectInfo } from "@/components/OrganSelector"
import type {
  ActionType,
  IntentResult,
  PhraseResult,
  OrganNode,
  ReceiverType,
} from "@/types"

const ACTION_TYPES: ActionType[] = [
  "新案",
  "復函",
  "轉函",
  "檢送文件",
  "會議通知",
  "公布法令",
  "人事命令",
  "報告",
]

interface BasicInfoFormProps {
  intent: IntentResult
  onIntentChange: (intent: IntentResult) => void
  phraseResult: PhraseResult | null
  onPhraseResultChange: (result: PhraseResult | null) => void
  organTree: OrganNode[]
}

export default function BasicInfoForm({
  intent,
  onIntentChange,
  phraseResult,
  onPhraseResultChange,
  organTree,
}: BasicInfoFormProps) {
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
    if (dir === "上行文") return "bg-red-100 text-red-800 border-red-200"
    if (dir === "下行文") return "bg-green-100 text-green-800 border-green-200"
    return "bg-blue-100 text-blue-800 border-blue-200"
  }

  // Determine which non-gov types need a display name input
  const receiverNameConfig: Record<string, { label: string; placeholder: string }> = {
    "人民": { label: "受文者姓名", placeholder: "例：王小明" },
    "企業/公司": { label: "公司名稱", placeholder: "例：台積電股份有限公司" },
    "團體/協會": { label: "團體名稱", placeholder: "例：中華民國工商協進會" },
    "學校": { label: "學校名稱", placeholder: "例：國立臺灣大學" },
  }

  const showDisplayNameInput = intent.receiver_type in receiverNameConfig
  const displayNameInfo = receiverNameConfig[intent.receiver_type]

  const isPublic = intent.receiver_type === "公眾"
  const isCustomReceiver = intent.receiver_type === "自訂"

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>發文機關</Label>
        <OrganSelector
          label="發文機關"
          value={intent.sender}
          onChange={handleSenderChange}
          organTree={organTree}
          placeholder="例：教育部"
        />
      </div>

      <div className="space-y-2">
        <Label>受文者</Label>
        <OrganSelector
          label="受文者"
          value={intent.receiver}
          onChange={handleReceiverChange}
          organTree={organTree}
          placeholder="例：國立臺灣大學"
        />
        {intent.receiver_type !== "政府機關" && intent.receiver_type && (
          <Badge variant="secondary" className="text-xs mt-1">
            對象類型：{intent.receiver_type}
          </Badge>
        )}
      </div>

      {showDisplayNameInput && displayNameInfo && (
        <div className="space-y-2">
          <Label htmlFor="display-name">
            {displayNameInfo.label}
          </Label>
          <Input
            id="display-name"
            value={intent.receiver_display_name}
            onChange={(e) => updateField("receiver_display_name", e.target.value)}
            placeholder={displayNameInfo.placeholder}
          />
        </div>
      )}

      {isPublic && (
        <div className="text-sm text-muted-foreground bg-amber-50 rounded-md px-3 py-2 border border-amber-100">
          受文對象為公眾，將以公告方式發文。
        </div>
      )}

      {isCustomReceiver && (
        <div className="space-y-2">
          <Label htmlFor="custom-display-name">自訂對象名稱</Label>
          <Input
            id="custom-display-name"
            value={intent.receiver_display_name}
            onChange={(e) => updateField("receiver_display_name", e.target.value)}
            placeholder="請輸入受文對象全名"
          />
          <Label htmlFor="custom-direction">行文方向</Label>
          <Select
            value={
              phraseResult?.direction ?? "平行文"
            }
            onValueChange={(_v) => {
              // Direction for custom is informational; actual direction comes from API
            }}
            disabled
          >
            <SelectTrigger>
              <SelectValue placeholder="由系統判斷" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="上行文">上行文</SelectItem>
              <SelectItem value="平行文">平行文</SelectItem>
              <SelectItem value="下行文">下行文</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>行文類型</Label>
        <Select
          value={intent.action_type}
          onValueChange={(v) => updateField("action_type", v as ActionType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="選擇行文類型" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject_brief">主旨摘要</Label>
        <Input
          id="subject_brief"
          value={intent.subject_brief}
          onChange={(e) => updateField("subject_brief", e.target.value)}
          placeholder="簡述公文目的"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference_doc">引述來文字號（選填）</Label>
        <Input
          id="reference_doc"
          value={intent.reference_doc ?? ""}
          onChange={(e) =>
            updateField("reference_doc", e.target.value || undefined)
          }
          placeholder="例：台教高(一)字第1120000000號"
        />
      </div>

      {phraseResult && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="shrink-0">行文方向：</Label>
              <Badge
                variant="outline"
                className={directionColor(phraseResult.direction)}
              >
                {phraseResult.direction}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(phraseResult.phrases).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="text-muted-foreground shrink-0">
                    {key}：
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {val}
                  </Badge>
                </div>
              ))}
            </div>

            {phraseResult.opening && (
              <div className="text-sm">
                <span className="text-muted-foreground">開頭語：</span>
                <span className="ml-1">{phraseResult.opening}</span>
              </div>
            )}
            {phraseResult.expectation && (
              <div className="text-sm">
                <span className="text-muted-foreground">期望語：</span>
                <span className="ml-1">{phraseResult.expectation}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
