import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronRight, ChevronLeft, X, Sparkles, ArrowLeft, ArrowRight } from "lucide-react"

interface LawArticle {
  no: string
  content: string
}

interface CheckedArticle extends LawArticle {
  checked: boolean
}

interface LawSuggestion {
  law_name: string
  category?: string
  article_count?: number
  articles: LawArticle[]
}

export interface SelectedLaw {
  law_name: string
  articles: CheckedArticle[]
}

interface CategoryNode {
  name: string
  count: number
  children?: CategoryNode[]
}

interface Step3LawSuggestionProps {
  suggestions: LawSuggestion[]
  onNext: (selectedLaws: SelectedLaw[]) => void
  onBack: () => void
  onSkip: () => void
}

export default function Step3LawSuggestion({
  suggestions,
  onNext,
  onBack,
  onSkip,
}: Step3LawSuggestionProps) {
  const [searchText, setSearchText] = useState("")
  const [searchResults, setSearchResults] = useState<LawSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedLaws, setSelectedLaws] = useState<SelectedLaw[]>([])
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [catPath, setCatPath] = useState<string[]>([])
  const [catResults, setCatResults] = useState<LawSuggestion[]>([])
  const [browsingCat, setBrowsingCat] = useState(false)
  const [detailLaw, setDetailLaw] = useState<SelectedLaw | null>(null)

  useEffect(() => {
    const initial = suggestions
      .filter((s) => s.articles.length > 0)
      .map((s) => ({
        law_name: s.law_name,
        articles: s.articles.map((a) => ({ ...a, checked: true })),
      }))
    setSelectedLaws(initial)
  }, [suggestions])

  useEffect(() => {
    fetch("/api/law-categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {})
  }, [])

  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) return
    setSearching(true)
    try {
      const res = await fetch("/api/suggest-laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: { subject_brief: searchText.trim() },
          doc_type: "",
          subtype: "",
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.suggestions || [])
      }
    } catch { /* ignore */ }
    setSearching(false)
  }, [searchText])

  const handleBrowseCategory = async (catName: string) => {
    const newPath = [...catPath, catName]
    setCatPath(newPath)
    // Build category prefix: e.g., "行政＞勞動部＞勞動保險目"
    const prefix = newPath.join("＞")
    try {
      const res = await fetch("/api/browse-laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_prefix: prefix }),
      })
      if (res.ok) {
        const data = await res.json()
        setCatResults(data.laws || [])
        setBrowsingCat(true)
      }
    } catch { /* ignore */ }
  }

  const toggleLaw = async (law: LawSuggestion) => {
    if (isSelected(law.law_name)) {
      removeLaw(law.law_name)
      return
    }

    let articles = law.articles
    if (articles.length === 0) {
      // Fetch articles for this law
      try {
        const res = await fetch("/api/suggest-laws", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: { subject_brief: law.law_name },
            doc_type: "",
            subtype: "",
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const found = (data.suggestions || []).find(
            (s: LawSuggestion) => s.law_name === law.law_name
          )
          if (found) articles = found.articles
        }
      } catch { /* ignore */ }
    }

    setSelectedLaws((prev) => [...prev, {
      law_name: law.law_name,
      articles: articles.map((a) => ({ ...a, checked: true })),
    }])
  }

  const toggleArticle = (lawName: string, articleNo: string) => {
    setSelectedLaws((prev) => prev.map((s) =>
      s.law_name === lawName
        ? { ...s, articles: s.articles.map((a) => a.no === articleNo ? { ...a, checked: !a.checked } : a) }
        : s
    ))
  }

  const removeLaw = (lawName: string) => {
    setSelectedLaws((prev) => prev.filter((s) => s.law_name !== lawName))
  }

  const isSelected = (lawName: string) => selectedLaws.some((s) => s.law_name === lawName)

  const currentCatChildren = (() => {
    let node = categories
    for (const p of catPath) {
      const found = node.find((n) => n.name === p)
      if (found?.children) node = found.children
      else return []
    }
    return node
  })()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-[#1B2D6B]">法規引用</h2>
          <p className="text-sm text-[#666] mt-1">
            AI 已預選相關法規。可搜尋或瀏覽分類來新增。
          </p>
        </div>
        {suggestions.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-[#F5922A] bg-[#F5922A]/10 px-2 py-1 rounded-full">
            <Sparkles className="h-3 w-3" /> AI 已建議 {suggestions.length} 部
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Browse + Search (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜尋法規，例如「行政程序法」「勞工保險」「公司法」"
                className="pr-9"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999] pointer-events-none" />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchText.trim() || searching}
              size="sm"
              className="bg-[#1B2D6B] hover:bg-[#152350] text-white"
            >
              {searching ? "搜尋中..." : "搜尋"}
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-[#F5F1EC] text-xs font-medium text-[#666]">
                搜尋結果（點擊加入）
              </div>
              {searchResults.map((law, i) => (
                <button
                  key={i}
                  onClick={() => toggleLaw(law)}
                  
                  className={`w-full text-left px-3 py-2 text-sm border-t border-[#E1E1E1] transition-colors ${
                    isSelected(law.law_name)
                      ? "bg-[#F5922A]/5 text-[#999]"
                      : "hover:bg-[#F5F1EC]"
                  }`}
                >
                  <span className="font-medium">{law.law_name}</span>
                  {law.article_count && <span className="text-xs text-[#999] ml-2">{law.article_count}條</span>}
                  {isSelected(law.law_name) && <span className="ml-2 text-xs text-[#F5922A]">已選</span>}
                </button>
              ))}
            </div>
          )}

          {/* Category browser */}
          <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-[#F5F1EC] text-xs font-medium text-[#666] flex items-center">
              <span>法規分類</span>
              {catPath.length > 0 && (
                <span className="text-[#999] ml-1">— {catPath.join(" > ")}</span>
              )}
            </div>

            {catPath.length > 0 && (
              <button
                onClick={() => {
                  setCatPath((prev) => prev.slice(0, -1))
                  setCatResults([])
                  setBrowsingCat(false)
                }}
                className="flex items-center gap-1 w-full px-3 py-1.5 text-xs text-[#666] hover:bg-[#F5F1EC] border-t border-[#E1E1E1]"
              >
                <ChevronLeft className="h-3 w-3" /> 返回上層
              </button>
            )}

            <div className="max-h-64 overflow-y-auto">
              {browsingCat && catResults.length > 0 ? (
                catResults.map((law, i) => (
                  <button
                    key={i}
                    onClick={() => toggleLaw(law)}
                    
                    className={`w-full text-left px-3 py-1.5 text-sm border-t border-[#E1E1E1] transition-colors ${
                      isSelected(law.law_name) ? "bg-[#F5922A]/5 text-[#999]" : "hover:bg-[#F5F1EC]"
                    }`}
                  >
                    <span>{law.law_name}</span>
                    {isSelected(law.law_name) && <span className="ml-2 text-xs text-[#F5922A]">已選</span>}
                  </button>
                ))
              ) : (
                currentCatChildren.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (cat.children && cat.children.length > 0) {
                        setCatPath((prev) => [...prev, cat.name])
                        setBrowsingCat(false)
                        setCatResults([])
                      } else {
                        handleBrowseCategory(cat.name)
                      }
                    }}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-sm border-t border-[#E1E1E1] hover:bg-[#F5F1EC] transition-colors"
                  >
                    <span>{cat.name}</span>
                    <span className="flex items-center gap-1 text-xs text-[#999]">
                      {cat.count}
                      {cat.children && cat.children.length > 0 && <ChevronRight className="h-3 w-3" />}
                    </span>
                  </button>
                ))
              )}
              {currentCatChildren.length === 0 && !browsingCat && (
                <div className="px-3 py-4 text-sm text-[#999] text-center">載入中...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected laws (1 col) */}
        <div className="lg:col-span-1">
          <div className="border border-[#E1E1E1] rounded-lg overflow-hidden lg:sticky lg:top-4">
            <div className="px-3 py-2 bg-[#1B2D6B] text-white text-sm font-medium">
              已選法規 ({selectedLaws.length})
            </div>

            {selectedLaws.length === 0 ? (
              <div className="px-3 py-8 text-sm text-[#999] text-center">
                尚未選取法規
              </div>
            ) : (
              <div className="divide-y divide-[#E1E1E1] max-h-96 overflow-y-auto">
                {selectedLaws.map((law, i) => (
                  <div key={i} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#222]">{law.law_name}</span>
                      <button
                        onClick={() => removeLaw(law.law_name)}
                        className="shrink-0 p-1 text-[#999] hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {law.articles.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {law.articles.map((a, ai) => (
                          <label key={ai} className="flex items-start gap-1.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={a.checked}
                              onChange={() => toggleArticle(law.law_name, a.no)}
                              className="mt-0.5 rounded border-[#E1E1E1] text-[#F5922A] focus:ring-[#F5922A]"
                            />
                            <span className={`text-xs leading-relaxed ${a.checked ? "text-[#444]" : "text-[#999] line-through"}`}>
                              <span className="font-medium">{a.no}</span>：{a.content.slice(0, 50)}...
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail dialog */}
      {detailLaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDetailLaw(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-[#E1E1E1] flex items-center justify-between">
              <h3 className="font-medium text-[#1B2D6B]">{detailLaw.law_name}</h3>
              <button onClick={() => setDetailLaw(null)} className="p-1 hover:bg-[#F5F1EC] rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-3 overflow-y-auto max-h-[55vh] space-y-3">
              {detailLaw.articles.length > 0 ? (
                detailLaw.articles.map((a, ai) => (
                  <div key={ai} className="text-sm">
                    <div className="font-medium text-[#1B2D6B]">{a.no}</div>
                    <div className="text-[#444] mt-1 leading-relaxed">{a.content}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[#999]">無條文預覽</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => {
            // Only pass laws with at least one checked article
            const filtered = selectedLaws
              .map((s) => ({ ...s, articles: s.articles.filter((a) => a.checked) }))
              .filter((s) => s.articles.length > 0)
            onNext(filtered)
          }}
          className="flex-1 bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full font-medium"
          size="lg"
        >
          <ArrowRight className="h-4 w-4" />
          下一步：補充資訊
        </Button>
        <Button variant="outline" onClick={onSkip} className="border-[#E1E1E1] text-[#666] rounded-full" size="lg">
          跳過
        </Button>
        <Button variant="outline" onClick={onBack} className="border-[#1B2D6B] text-[#1B2D6B] rounded-full" size="lg">
          <ArrowLeft className="h-4 w-4" />
          上一步
        </Button>
      </div>
    </div>
  )
}
