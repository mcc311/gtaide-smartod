
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Trash2, Eye, ArrowLeft } from "lucide-react"
import type { DocType, GenerateRequest } from "@/types"

interface Citation {
  law_name: string
  article_no: string
  valid: boolean
}

interface Step3ContentProps {
  docType: DocType | null
  form: GenerateRequest
  onFormChange: (form: GenerateRequest) => void
  onPreview: () => void
  onBack: () => void
  citations?: Citation[]
}

export default function Step3Content({
  docType,
  form,
  onFormChange,
  onPreview,
  onBack,
  citations = [],
}: Step3ContentProps) {
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
      ? "text-[#D5705D]"
      : subjectLen > 60
        ? "text-[#F5922A]"
        : "text-[#999]"

  const isMeeting = docType === "開會通知單"
  const isBulletin = docType === "公告"
  const isSign = docType === "簽" || docType === "便簽"

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-[#1B2D6B] flex items-center gap-2">
        編輯公文內容
        {docType && (
          <span className="text-[#666] font-normal ml-2 text-base">
            ({docType})
          </span>
        )}
      </h2>
      <p className="text-sm text-[#666] mt-1 mb-5">
        填寫或修改公文各段內容，完成後可預覽輸出。
      </p>

      <div className="space-y-4">
          {/* Subject detail */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subject_detail" className="text-[#222] font-medium text-sm">主旨</Label>
              <span className={`text-xs ${subjectColor}`}>{subjectLen}/60</span>
            </div>
            <Textarea
              id="subject_detail"
              value={form.subject_detail}
              onChange={(e) => update("subject_detail", e.target.value)}
              placeholder="完整的主旨內容（建議60字以內）"
              rows={2}
              className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
            />
          </div>

          <Separator className="bg-[#E1E1E1]" />

          {/* Explanation items */}
          {!isMeeting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#222] font-medium text-sm">{isBulletin ? "依據" : "說明"}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addListItem("explanation_items")}
                  className="text-[#666] hover:bg-[#F5F1EC] rounded-full"
                >
                  <Plus className="h-4 w-4" />
                  新增
                </Button>
              </div>
              {form.explanation_items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-sm text-[#999] mt-2 shrink-0 w-6 text-right">
                    {form.explanation_items.length > 1 ? `${i + 1}.` : ""}
                  </span>
                  <Textarea
                    value={item}
                    onChange={(e) =>
                      updateListItem("explanation_items", i, e.target.value)
                    }
                    placeholder={isBulletin ? "依據內容" : "說明事項"}
                    rows={2}
                    className="flex-1 rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                  />
                  {form.explanation_items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem("explanation_items", i)}
                      className="shrink-0 mt-1 text-[#666] hover:bg-[#F5F1EC] rounded-full"
                    >
                      <Trash2 className="h-4 w-4 text-[#666]" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action items */}
          {!isMeeting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#222] font-medium text-sm">
                  {isBulletin ? "公告事項" : isSign ? "擬辦" : "辦法"}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addListItem("action_items")}
                  className="text-[#666] hover:bg-[#F5F1EC] rounded-full"
                >
                  <Plus className="h-4 w-4" />
                  新增
                </Button>
              </div>
              {form.action_items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-sm text-[#999] mt-2 shrink-0 w-6 text-right">
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
                    className="flex-1 rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                  />
                  {form.action_items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem("action_items", i)}
                      className="shrink-0 mt-1 text-[#666] hover:bg-[#F5F1EC] rounded-full"
                    >
                      <Trash2 className="h-4 w-4 text-[#666]" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Law citations */}
          {citations.length > 0 && (
            <div className="space-y-2">
              <Separator className="bg-[#E1E1E1]" />
              <Label className="text-[#222] font-medium text-sm flex items-center gap-1.5">
                <span className="text-base">&#128218;</span> AI 引用法規
              </Label>
              <div className="space-y-1">
                {citations.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[#444] bg-[#F5F1EC] rounded-md px-3 py-1.5">
                    <span className="text-green-600">&#10003;</span>
                    <span className="font-medium">{c.law_name}</span>
                    {c.article_no && <span className="text-[#666]">{c.article_no}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meeting-specific fields */}
          {isMeeting && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="meeting_time" className="text-[#222] font-medium text-sm">開會時間</Label>
                  <Input
                    id="meeting_time"
                    value={form.meeting_time ?? ""}
                    onChange={(e) => update("meeting_time", e.target.value)}
                    placeholder="例：115年4月1日（星期二）上午10時"
                    className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting_place" className="text-[#222] font-medium text-sm">開會地點</Label>
                  <Input
                    id="meeting_place"
                    value={form.meeting_place ?? ""}
                    onChange={(e) => update("meeting_place", e.target.value)}
                    placeholder="例：本部5樓大禮堂"
                    className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_chair" className="text-[#222] font-medium text-sm">主席</Label>
                <Input
                  id="meeting_chair"
                  value={form.meeting_chair ?? ""}
                  onChange={(e) => update("meeting_chair", e.target.value)}
                  placeholder="主席姓名或職稱"
                  className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="meeting_contact" className="text-[#222] font-medium text-sm">聯絡人</Label>
                  <Input
                    id="meeting_contact"
                    value={form.meeting_contact ?? ""}
                    onChange={(e) => update("meeting_contact", e.target.value)}
                    placeholder="聯絡人姓名"
                    className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting_contact_phone" className="text-[#222] font-medium text-sm">聯絡電話</Label>
                  <Input
                    id="meeting_contact_phone"
                    value={form.meeting_contact_phone ?? ""}
                    onChange={(e) => update("meeting_contact_phone", e.target.value)}
                    placeholder="電話號碼"
                    className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_notes" className="text-[#222] font-medium text-sm">備註（選填）</Label>
                <Textarea
                  id="meeting_notes"
                  value={form.meeting_notes ?? ""}
                  onChange={(e) => update("meeting_notes", e.target.value)}
                  placeholder="其他備註事項"
                  rows={2}
                  className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
                />
              </div>
            </div>
          )}

          <Separator className="bg-[#E1E1E1]" />

          {/* Recipients row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#222] font-medium text-sm">正本受文者</Label>
              <TagInput
                value={form.recipients_main}
                onChange={(tags) => update("recipients_main", tags)}
                placeholder="輸入後按 Enter 新增"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#222] font-medium text-sm">副本受文者（選填）</Label>
              <TagInput
                value={form.recipients_cc}
                onChange={(tags) => update("recipients_cc", tags)}
                placeholder="輸入後按 Enter 新增"
              />
            </div>
          </div>

          {/* Date + Doc number row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="doc_date" className="text-[#222] font-medium text-sm">發文日期</Label>
              <Input
                id="doc_date"
                type="date"
                value={form.doc_date}
                onChange={(e) => update("doc_date", e.target.value)}
                className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc_number" className="text-[#222] font-medium text-sm">發文字號</Label>
              <Input
                id="doc_number"
                value={form.doc_number}
                onChange={(e) => update("doc_number", e.target.value)}
                placeholder="例：台教高(一)字第1150000000號"
                className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[#222] font-medium text-sm">速別</Label>
              <Select
                value={form.speed}
                onValueChange={(v) => update("speed", v)}
              >
                <SelectTrigger className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10">
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
              <Label htmlFor="attachments_text" className="text-[#222] font-medium text-sm">附件（選填）</Label>
              <Input
                id="attachments_text"
                value={form.attachments_text}
                onChange={(e) => update("attachments_text", e.target.value)}
                placeholder="例：如說明二"
                className="rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-[#1B2D6B]/10"
              />
            </div>
          </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button onClick={onPreview} className="w-full sm:w-auto sm:flex-1 bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full font-medium" size="lg">
          <Eye className="h-4 w-4" />
          預覽公文
        </Button>
        <Button variant="outline" onClick={onBack} size="lg" className="w-full sm:w-auto border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium">
          <ArrowLeft className="h-4 w-4" />
          返回上一步
        </Button>
      </div>
    </div>
  )
}
