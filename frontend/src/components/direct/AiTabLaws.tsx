import { Plus, Check } from "lucide-react"
import type { UseDirectDocStateReturn } from "./useDirectDocState"

interface AiTabLawsProps {
  hook: UseDirectDocStateReturn
  onOpenSearch: () => void
}

export default function AiTabLaws({ hook, onOpenSearch }: AiTabLawsProps) {
  const { state, update, regenerate } = hook
  const cited = state.citations
  const suggested = state.lawSuggestions

  return (
    <div className="space-y-3">
      {cited.length > 0 && (
        <>
          <div className="text-xs uppercase tracking-wider text-[#666]">已引用 ({cited.length})</div>
          {cited.map((c, i) => (
            <div key={`c-${i}`} className="rounded-md border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-2 text-sm">
              <div className="flex items-center gap-1 text-[#065F46]">
                <Check className="h-3 w-3" />
                <span className="font-medium">{c.law_name}</span>
              </div>
              {c.article_no && <div className="text-xs text-[#666] mt-0.5">{c.article_no}</div>}
            </div>
          ))}
        </>
      )}

      {suggested.length > 0 && (
        <>
          <div className="text-xs uppercase tracking-wider text-[#666] mt-3">AI 推薦</div>
          {suggested.map((s) => {
            const isSelected = state.selectedLaws.some((sl) => sl.law_name === s.law_name)
            return (
              <div key={s.law_name} className="rounded-md border border-[#E1E1E1] bg-white px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#222]">{s.law_name}</span>
                  <button
                    type="button"
                    className="text-xs text-[#1B2D6B] hover:underline"
                    onClick={() => {
                      const next = isSelected
                        ? state.selectedLaws.filter((sl) => sl.law_name !== s.law_name)
                        : [
                            ...state.selectedLaws,
                            {
                              law_name: s.law_name,
                              articles: s.articles.map((a) => ({ ...a, checked: true })),
                            },
                          ]
                      update({ selectedLaws: next })
                    }}
                  >
                    {isSelected ? "✓ 已加入" : "+ 加入引用"}
                  </button>
                </div>
                {s.category && <div className="text-xs text-[#999] mt-0.5">{s.category}</div>}
              </div>
            )
          })}
        </>
      )}

      {cited.length === 0 && suggested.length === 0 && (
        <div className="text-sm text-[#999]">尚無已引用 / 推薦法規。可點下方搜尋。</div>
      )}

      <button
        type="button"
        className="w-full mt-2 inline-flex items-center justify-center gap-1 text-sm text-[#1B2D6B] border border-dashed border-[#1B2D6B] rounded-md py-2 hover:bg-[#F5F1EC]"
        onClick={onOpenSearch}
      >
        <Plus className="h-3 w-3" /> 搜尋更多法規
      </button>

      {state.phase === "ready" && (
        <button
          type="button"
          className="w-full text-sm bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-md py-2 font-medium mt-2"
          onClick={regenerate}
        >
          以最新法規重新生成
        </button>
      )}
    </div>
  )
}
