import type React from "react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"
import type { DocType, OrganNode, IntentResult, PhraseResult } from "@/types"
import OrganSelector from "@/components/OrganSelector"
import type { OrganSelectInfo } from "@/components/OrganSelector"
import Editable from "./Editable"
import Pickable from "./Pickable"
import TagsInline from "./TagsInline"
import ListSection from "./ListSection"
import PlaceholderBlock from "./PlaceholderBlock"
import { DOC_TYPES, DIRECTIONS } from "./constants"

// Inner phrase keys to expose as chips. 期望語/開頭語 are stored at top-level
// (state.phrases.expectation / .opening) and rendered separately.
const INNER_PHRASE_KEYS: Array<keyof PhraseResult["phrases"]> = [
  "稱謂",
  "自稱",
  "引敘語",
  "附送語",
  "經辦語",
]

interface DocCanvasProps {
  hook: UseDirectDocStateReturn
  organTree: OrganNode[]
}

export default function DocCanvas({ hook, organTree }: DocCanvasProps) {
  const { state, mergedIntent, update, overrideIntent } = hook

  const handleSender = (info: OrganSelectInfo) => {
    overrideIntent(
      {
        sender: info.name,
        sender_level: info.level ?? 0,
        sender_parent: info.parentContext ?? "",
      },
      "sender"
    )
  }
  const handleReceiver = (info: OrganSelectInfo) => {
    overrideIntent(
      {
        receiver: info.name,
        receiver_level: info.level ?? 0,
        receiver_parent: info.parentContext ?? "",
        receiver_type:
          (info.receiverType as IntentResult["receiver_type"]) ??
          mergedIntent?.receiver_type ??
          "政府機關",
        receiver_display_name: info.isCustom ? info.name : "",
      },
      "receiver"
    )
  }
  const docType = state.docType
  const direction = state.phrases?.direction ?? "平行文"
  const subtype = mergedIntent?.subtype ?? ""

  const updateInnerPhrase = (k: keyof PhraseResult["phrases"], v: string) => {
    if (!state.phrases) return
    update(
      {
        phrases: {
          ...state.phrases,
          phrases: { ...state.phrases.phrases, [k]: v },
        },
      },
      `phrase_${k}`
    )
  }
  const updateTopPhrase = (k: "opening" | "expectation", v: string) => {
    if (!state.phrases) return
    update({ phrases: { ...state.phrases, [k]: v } }, `phrase_${k}`)
  }
  const directionColor =
    direction === "上行文"
      ? "bg-[#FEE7E5] text-[#991B1B]"
      : direction === "下行文"
      ? "bg-[#DCFCE7] text-[#065F46]"
      : "bg-[#DBEAFE] text-[#1E40AF]"

  return (
    <article className="bg-white rounded-lg shadow-sm border border-[#E1E1E1] p-8 max-w-3xl mx-auto font-serif">
      <header className="flex items-baseline justify-between border-b border-[#1B2D6B] pb-3">
        <div className="text-2xl font-bold text-[#1B2D6B] tracking-wider min-w-[12rem]">
          <OrganSelector
            label="發文機關"
            value={mergedIntent?.sender ?? ""}
            onChange={handleSender}
            organTree={organTree}
            placeholder="點此選擇發文機關"
          />
        </div>
        <Pickable
          value={docType}
          options={[...DOC_TYPES]}
          className="text-xl font-semibold text-[#1B2D6B]"
          onChange={(v) => update({ docType: v as DocType }, "doc_type")}
          recent={state.recentChange === "doc_type"}
        />
      </header>

      <div className="flex items-center gap-2 mt-3">
        {state.phrases && (
          <Pickable
            value={direction}
            options={[...DIRECTIONS]}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${directionColor}`}
            onChange={(v) =>
              update(
                { phrases: { ...state.phrases!, direction: v as typeof direction } },
                "direction"
              )
            }
            recent={state.recentChange === "direction"}
          />
        )}
        {subtype && (
          <Editable
            value={subtype}
            className="text-xs px-2 py-0.5 rounded-full bg-[#FFEDD5] text-[#9A3412]"
            onChange={(v) => overrideIntent({ subtype: v }, "subtype")}
            recent={state.recentChange === "subtype"}
          />
        )}
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-y-2 text-sm">
        <div className="flex items-baseline gap-2">
          <dt className="text-[#666] shrink-0 w-20">受文者：</dt>
          <dd className="flex-1">
            <OrganSelector
              label="受文者"
              value={mergedIntent?.receiver ?? ""}
              onChange={handleReceiver}
              organTree={organTree}
              placeholder="點此選擇受文者"
            />
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-2">
            <dt className="text-[#666] shrink-0 w-20">發文日期：</dt>
            <dd className="flex-1">
              <Editable
                value={state.doc_date}
                placeholder="如：115年04月29日"
                onChange={(v) => update({ doc_date: v }, "doc_date")}
                recent={state.recentChange === "doc_date"}
              />
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[#666] shrink-0 w-20">發文字號：</dt>
            <dd className="flex-1">
              <Editable
                value={state.doc_number}
                placeholder="如：保普字第1150010234號"
                onChange={(v) => update({ doc_number: v }, "doc_number")}
                recent={state.recentChange === "doc_number"}
              />
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[#666] shrink-0 w-20">速別：</dt>
            <dd className="flex-1">
              <Pickable
                value={state.speed}
                options={["最速件", "速件", "普通件"]}
                onChange={(v) => update({ speed: v as "最速件" | "速件" | "普通件" }, "speed")}
                recent={state.recentChange === "speed"}
              />
            </dd>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-[#666] shrink-0 w-20">附件：</dt>
          <dd className="flex-1">
            <TagsInline
              tags={state.attachments}
              onChange={(t) => update({ attachments: t }, "attachments")}
              placeholder="+ 附件"
            />
          </dd>
        </div>
      </dl>

      {state.phrases && (
        <div className="mt-5 pt-3 border-t border-dashed border-[#E1E1E1]">
          <div className="text-xs uppercase tracking-wider text-[#999] mb-2">公文用語（將套用於各段）</div>
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm">
            {INNER_PHRASE_KEYS.map((k) => (
              <PhraseChip
                key={k}
                label={k}
                value={state.phrases?.phrases[k] ?? ""}
                onChange={(v) => updateInnerPhrase(k, v)}
                recent={state.recentChange === `phrase_${k}`}
              />
            ))}
            <PhraseChip
              label="開頭語"
              value={state.phrases.opening ?? ""}
              onChange={(v) => updateTopPhrase("opening", v)}
              recent={state.recentChange === "phrase_opening"}
            />
            <PhraseChip
              label="期望語"
              value={state.phrases.expectation ?? ""}
              onChange={(v) => updateTopPhrase("expectation", v)}
              recent={state.recentChange === "phrase_expectation"}
            />
          </div>
        </div>
      )}

      <hr className="my-5 border-t border-[#E1E1E1]" />

      <section className="space-y-4">
        <SectionRow label={state.docType === "開會通知單" ? "開會事由" : "主旨"}>
          {state.subject_detail ? (
            <Editable
              multiline
              value={state.subject_detail}
              onChange={(v) => update({ subject_detail: v }, "subject_detail")}
              recent={state.recentChange === "subject_detail"}
              className="text-sm leading-relaxed"
            />
          ) : state.phase === "ready" ? (
            <Editable
              multiline
              value=""
              placeholder="點此撰寫主旨..."
              onChange={(v) => update({ subject_detail: v }, "subject_detail")}
            />
          ) : (
            <PlaceholderBlock unansweredCount={hook.unansweredRequired.length} />
          )}
        </SectionRow>

        {/* Meeting-specific fields — replace 說明/辦法 for 開會通知單 */}
        {state.docType === "開會通知單" ? (
          <div className="space-y-2">
            <SectionRow label="開會時間">
              <Editable
                value={state.meeting_time}
                placeholder="例：115年4月29日（星期二）下午2時"
                onChange={(v) => update({ meeting_time: v }, "meeting_time")}
                recent={state.recentChange === "meeting_time"}
              />
            </SectionRow>
            <SectionRow label="開會地點">
              <Editable
                value={state.meeting_place}
                placeholder="例：本部第一會議室"
                onChange={(v) => update({ meeting_place: v }, "meeting_place")}
                recent={state.recentChange === "meeting_place"}
              />
            </SectionRow>
            <SectionRow label="主持人">
              <Editable
                value={state.meeting_chair}
                placeholder="例：本部○次長"
                onChange={(v) => update({ meeting_chair: v }, "meeting_chair")}
                recent={state.recentChange === "meeting_chair"}
              />
            </SectionRow>
            <SectionRow label="聯絡人">
              <div className="flex flex-wrap gap-2 items-baseline">
                <Editable
                  value={state.meeting_contact}
                  placeholder="姓名"
                  onChange={(v) => update({ meeting_contact: v }, "meeting_contact")}
                />
                <Editable
                  value={state.meeting_contact_phone}
                  placeholder="電話"
                  onChange={(v) => update({ meeting_contact_phone: v }, "meeting_contact_phone")}
                />
              </div>
            </SectionRow>
            <SectionRow label="出席者">
              <TagsInline
                tags={state.meeting_attendees}
                onChange={(t) => update({ meeting_attendees: t }, "meeting_attendees")}
                placeholder="+ 出席者"
              />
            </SectionRow>
            <SectionRow label="列席者">
              <TagsInline
                tags={state.meeting_observers}
                onChange={(t) => update({ meeting_observers: t }, "meeting_observers")}
                placeholder="+ 列席者"
              />
            </SectionRow>
            <SectionRow label="備註">
              <Editable
                multiline
                value={state.meeting_notes}
                placeholder="（選填）"
                onChange={(v) => update({ meeting_notes: v }, "meeting_notes")}
              />
            </SectionRow>
          </div>
        ) : (
          <>
            <SectionRow label={state.docType === "公告" ? "依據" : "說明"}>
              {state.phase === "ready" || state.explanation_items.length > 0 ? (
                <ListSection
                  items={state.explanation_items}
                  placeholder={state.docType === "公告" ? "點此新增依據..." : "點此新增說明事項..."}
                  onChange={(items) => update({ explanation_items: items }, "explanation_items")}
                />
              ) : (
                <PlaceholderBlock unansweredCount={hook.unansweredRequired.length} />
              )}
            </SectionRow>

            <SectionRow
              label={
                state.docType === "公告"
                  ? "公告事項"
                  : state.docType === "簽" || state.docType === "便簽"
                  ? "擬辦"
                  : "辦法"
              }
            >
              {state.phase === "ready" || state.action_items.length > 0 ? (
                <ListSection
                  items={state.action_items}
                  placeholder="點此新增段落..."
                  onChange={(items) => update({ action_items: items }, "action_items")}
                />
              ) : (
                <PlaceholderBlock unansweredCount={hook.unansweredRequired.length} />
              )}
            </SectionRow>
          </>
        )}
      </section>

      {/* Recipients (正本/副本) — only for doc types with formal recipients */}
      {(state.docType === "函" ||
        state.docType === "書函" ||
        state.docType === "開會通知單" ||
        state.docType === "令") && (
        <div className="mt-6 pt-3 border-t border-dashed border-[#E1E1E1] space-y-2">
          <SectionRow label="正本">
            <TagsInline
              tags={state.recipients_main}
              onChange={(t) => update({ recipients_main: t }, "recipients_main")}
              placeholder="+ 正本受文者"
            />
          </SectionRow>
          <SectionRow label="副本">
            <TagsInline
              tags={state.recipients_cc}
              onChange={(t) => update({ recipients_cc: t }, "recipients_cc")}
              placeholder="+ 副本受文者"
            />
          </SectionRow>
        </div>
      )}

      <footer className="mt-8 text-right text-sm text-[#1B2D6B]">
        <div className="font-semibold">{mergedIntent?.sender || "—"}</div>
        <div className="text-xs text-[#666] mt-1">
          {state.docType === "簽" || state.docType === "便簽" ? "簽辦人" : "機關首長"}
        </div>
      </footer>
    </article>
  )
}

function SectionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-12 text-sm font-semibold text-[#1B2D6B] pt-0.5">{label}：</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function PhraseChip({
  label,
  value,
  onChange,
  recent,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  recent?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#F5F1EC] rounded-md px-2 py-1 border border-transparent hover:border-[#E1E1E1]">
      <span className="text-xs text-[#999]">{label}</span>
      <Editable
        value={value}
        placeholder="—"
        className="text-sm text-[#1B2D6B]"
        onChange={onChange}
        recent={recent}
      />
    </span>
  )
}
