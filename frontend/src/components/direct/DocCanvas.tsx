import type React from "react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"
import type { DocType } from "@/types"
import Editable from "./Editable"
import Pickable from "./Pickable"
import TagsInline from "./TagsInline"
import ListSection from "./ListSection"
import PlaceholderBlock from "./PlaceholderBlock"
import { DOC_TYPES, DIRECTIONS } from "./constants"

interface DocCanvasProps {
  hook: UseDirectDocStateReturn
}

export default function DocCanvas({ hook }: DocCanvasProps) {
  const { state, mergedIntent, update, overrideIntent } = hook
  const docType = state.docType
  const direction = state.phrases?.direction ?? "平行文"
  const subtype = mergedIntent?.subtype ?? ""
  const directionColor =
    direction === "上行文"
      ? "bg-[#FEE7E5] text-[#991B1B]"
      : direction === "下行文"
      ? "bg-[#DCFCE7] text-[#065F46]"
      : "bg-[#DBEAFE] text-[#1E40AF]"

  return (
    <article className="bg-white rounded-lg shadow-sm border border-[#E1E1E1] p-8 max-w-3xl mx-auto font-serif">
      <header className="flex items-baseline justify-between border-b border-[#1B2D6B] pb-3">
        <Editable
          value={mergedIntent?.sender ?? ""}
          placeholder="點此輸入發文機關"
          className="text-2xl font-bold text-[#1B2D6B] tracking-wider"
          onChange={(v) => overrideIntent({ sender: v }, "sender")}
          recent={state.recentChange === "sender"}
        />
        <Pickable
          value={docType}
          options={[...DOC_TYPES]}
          className="text-xl font-semibold text-[#1B2D6B]"
          onChange={(v) => update({ docType: v as DocType }, "doc_type")}
          recent={state.recentChange === "doc_type"}
        />
      </header>

      <div className="flex items-center gap-2 mt-3">
        <Pickable
          value={direction}
          options={[...DIRECTIONS]}
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${directionColor}`}
          onChange={(v) =>
            update(
              {
                phrases: state.phrases
                  ? { ...state.phrases, direction: v as typeof direction }
                  : null,
              },
              "direction"
            )
          }
          recent={state.recentChange === "direction"}
        />
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
            <Editable
              value={mergedIntent?.receiver ?? ""}
              placeholder="點此輸入受文者..."
              onChange={(v) => overrideIntent({ receiver: v }, "receiver")}
              recent={state.recentChange === "receiver"}
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

      <hr className="my-5 border-t border-[#E1E1E1]" />

      <section className="space-y-4">
        <SectionRow label="主旨">
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

        <SectionRow label="說明">
          {state.phase === "ready" || state.explanation_items.length > 0 ? (
            <ListSection
              items={state.explanation_items}
              placeholder="點此新增說明事項..."
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
      </section>

      <footer className="mt-8 text-right text-sm text-[#1B2D6B]">
        <div className="font-semibold">{mergedIntent?.sender || "—"}</div>
        <div className="text-xs text-[#666] mt-1">機關首長</div>
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
