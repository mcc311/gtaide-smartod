import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"
import type { DocType, GenerateRequest } from "@/types"

interface ContentFormProps {
  docType: DocType | null
  form: GenerateRequest
  onFormChange: (form: GenerateRequest) => void
}

function rocToday(): string {
  const now = new Date()
  const rocYear = now.getFullYear() - 1911
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `中華民國${rocYear}年${month}月${day}日`
}

export default function ContentForm({
  docType,
  form,
  onFormChange,
}: ContentFormProps) {
  const update = <K extends keyof GenerateRequest>(
    key: K,
    value: GenerateRequest[K]
  ) => {
    onFormChange({ ...form, [key]: value })
  }

  const updateListItem = (
    key: "explanation_items" | "action_items",
    index: number,
    value: string
  ) => {
    const list = [...form[key]]
    list[index] = value
    update(key, list)
  }

  const addListItem = (key: "explanation_items" | "action_items") => {
    update(key, [...form[key], ""])
  }

  const removeListItem = (
    key: "explanation_items" | "action_items",
    index: number
  ) => {
    update(
      key,
      form[key].filter((_, i) => i !== index)
    )
  }

  const subjectLen = form.subject_detail.length
  const subjectColor =
    subjectLen > 80
      ? "text-red-500"
      : subjectLen > 60
        ? "text-yellow-600"
        : "text-muted-foreground"

  // Set default date if empty
  if (!form.doc_date) {
    update("doc_date", rocToday())
  }

  const isMeeting = docType === "開會通知單"
  const isBulletin = docType === "公告"
  const isSign = docType === "簽" || docType === "便簽"

  return (
    <div className="space-y-4">
      {/* Subject detail */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="subject_detail">主旨</Label>
          <span className={`text-xs ${subjectColor}`}>{subjectLen}/60</span>
        </div>
        <Textarea
          id="subject_detail"
          value={form.subject_detail}
          onChange={(e) => update("subject_detail", e.target.value)}
          placeholder="完整的主旨內容（建議60字以內）"
          rows={2}
        />
      </div>

      <Separator />

      {/* Explanation items */}
      {!isMeeting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{isBulletin ? "依據" : isSign ? "說明" : "說明"}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addListItem("explanation_items")}
            >
              <Plus className="h-4 w-4" />
              新增
            </Button>
          </div>
          {form.explanation_items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-sm text-muted-foreground mt-2 shrink-0 w-6 text-right">
                {form.explanation_items.length > 1 ? `${i + 1}.` : ""}
              </span>
              <Textarea
                value={item}
                onChange={(e) =>
                  updateListItem("explanation_items", i, e.target.value)
                }
                placeholder={
                  isBulletin
                    ? "依據內容"
                    : "說明事項"
                }
                rows={2}
                className="flex-1"
              />
              {form.explanation_items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeListItem("explanation_items", i)}
                  className="shrink-0 mt-1"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action items / 辦法 / 擬辦 / 公告事項 */}
      {!isMeeting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              {isBulletin ? "公告事項" : isSign ? "擬辦" : "辦法"}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addListItem("action_items")}
            >
              <Plus className="h-4 w-4" />
              新增
            </Button>
          </div>
          {form.action_items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-sm text-muted-foreground mt-2 shrink-0 w-6 text-right">
                {form.action_items.length > 1 ? `${i + 1}.` : ""}
              </span>
              <Textarea
                value={item}
                onChange={(e) =>
                  updateListItem("action_items", i, e.target.value)
                }
                placeholder={
                  isBulletin
                    ? "公告事項內容"
                    : isSign
                      ? "擬辦內容"
                      : "辦法內容"
                }
                rows={2}
                className="flex-1"
              />
              {form.action_items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeListItem("action_items", i)}
                  className="shrink-0 mt-1"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meeting-specific fields */}
      {isMeeting && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="meeting_time">開會時間</Label>
            <Input
              id="meeting_time"
              value={form.meeting_time ?? ""}
              onChange={(e) => update("meeting_time", e.target.value)}
              placeholder="例：115年4月1日（星期二）上午10時"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting_place">開會地點</Label>
            <Input
              id="meeting_place"
              value={form.meeting_place ?? ""}
              onChange={(e) => update("meeting_place", e.target.value)}
              placeholder="例：本部5樓大禮堂"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting_chair">主席</Label>
            <Input
              id="meeting_chair"
              value={form.meeting_chair ?? ""}
              onChange={(e) => update("meeting_chair", e.target.value)}
              placeholder="主席姓名或職稱"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="meeting_contact">聯絡人</Label>
              <Input
                id="meeting_contact"
                value={form.meeting_contact ?? ""}
                onChange={(e) => update("meeting_contact", e.target.value)}
                placeholder="聯絡人姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_contact_phone">聯絡電話</Label>
              <Input
                id="meeting_contact_phone"
                value={form.meeting_contact_phone ?? ""}
                onChange={(e) =>
                  update("meeting_contact_phone", e.target.value)
                }
                placeholder="電話號碼"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting_notes">備註（選填）</Label>
            <Textarea
              id="meeting_notes"
              value={form.meeting_notes ?? ""}
              onChange={(e) => update("meeting_notes", e.target.value)}
              placeholder="其他備註事項"
              rows={2}
            />
          </div>
        </div>
      )}

      <Separator />

      {/* Recipients */}
      <div className="space-y-2">
        <Label htmlFor="recipients_main">正本受文者</Label>
        <Input
          id="recipients_main"
          value={form.recipients_main.join("、")}
          onChange={(e) =>
            update(
              "recipients_main",
              e.target.value
                .split(/[、,]/)
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="以頓號（、）分隔多個受文者"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipients_cc">副本受文者（選填）</Label>
        <Input
          id="recipients_cc"
          value={form.recipients_cc.join("、")}
          onChange={(e) =>
            update(
              "recipients_cc",
              e.target.value
                .split(/[、,]/)
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="以頓號（、）分隔多個受文者"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="doc_date">發文日期</Label>
          <Input
            id="doc_date"
            value={form.doc_date}
            onChange={(e) => update("doc_date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc_number">發文字號</Label>
          <Input
            id="doc_number"
            value={form.doc_number}
            onChange={(e) => update("doc_number", e.target.value)}
            placeholder="例：台教高(一)字第1150000000號"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>速別</Label>
          <Select
            value={form.speed}
            onValueChange={(v) => update("speed", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="最速件">最速件</SelectItem>
              <SelectItem value="速件">速件</SelectItem>
              <SelectItem value="普通件">普通件</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="attachments_text">附件（選填）</Label>
          <Input
            id="attachments_text"
            value={form.attachments_text}
            onChange={(e) => update("attachments_text", e.target.value)}
            placeholder="例：如說明二"
          />
        </div>
      </div>
    </div>
  )
}
