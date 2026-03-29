import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronRight, ChevronLeft, X, Sparkles, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

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

  // Currently expanded law in left panel (showing articles)
  const [expandedLaw, setExpandedLaw] = useState<string | null>(null)
  const [expandedArticles, setExpandedArticles] = useState<LawArticle[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)

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
    setExpandedLaw(null)
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
    const prefix = newPath.join("＞")
    setExpandedLaw(null)
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

  // Expand a law to show its articles
  const handleExpandLaw = async (lawName: string) => {
    if (expandedLaw === lawName) {
      setExpandedLaw(null)
      return
    }
    setExpandedLaw(lawName)
    setLoadingArticles(true)
    try {
      const res = await fetch("/api/law-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ law_name: lawName }),
      })
      if (res.ok) {
        const data = await res.json()
        setExpandedArticles(data.articles || [])
      }
    } catch { /* ignore */ }
    setLoadingArticles(false)
  }

  const toggleArticleSelection = (lawName: string, article: LawArticle) => {
    const existing = selectedLaws.find((s) => s.law_name === lawName)
    if (existing) {
      const hasArticle = existing.articles.some((a) => a.no === article.no)
      if (hasArticle) {
        // Toggle off
        const updated = existing.articles.filter((a) => a.no !== article.no)
        if (updated.length === 0) {
          setSelectedLaws((prev) => prev.filter((s) => s.law_name !== lawName))
        } else {
          setSelectedLaws((prev) =>
            prev.map((s) => (s.law_name === lawName ? { ...s, articles: updated } : s))
          )
        }
      } else {
        // Add article
        setSelectedLaws((prev) =>
          prev.map((s) =>
            s.law_name === lawName
              ? { ...s, articles: [...s.articles, { ...article, checked: true }] }
              : s
          )
        )
      }
    } else {
      // New law
      setSelectedLaws((prev) => [
        ...prev,
        { law_name: lawName, articles: [{ ...article, checked: true }] },
      ])
    }
  }

  const isArticleSelected = (lawName: string, articleNo: string) => {
    const law = selectedLaws.find((s) => s.law_name === lawName)
    return law?.articles.some((a) => a.no === articleNo) ?? false
  }

  const removeLaw = (lawName: string) => {
    setSelectedLaws((prev) => prev.filter((s) => s.law_name !== lawName))
  }

  const currentCatChildren = (() => {
    let node = categories
    for (const p of catPath) {
      const found = node.find((n) => n.name === p)
      if (found?.children) node = found.children
      else return []
    }
    return node
  })()

  // Render a law item (in search results or category browse)
  const renderLawItem = (law: LawSuggestion, i: number) => {
    const isExpanded = expandedLaw === law.law_name
    const selectedCount = selectedLaws.find((s) => s.law_name === law.law_name)?.articles.length ?? 0

    return (
      <div key={i} className="border-t border-[#E1E1E1]">
        <button
          onClick={() => handleExpandLaw(law.law_name)}
          className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
            isExpanded ? "bg-[#1B2D6B]/5" : "hover:bg-[#F5F1EC]"
          }`}
        >
          <div>
            <span className="font-medium">{law.law_name}</span>
            {law.article_count && <span className="text-xs text-[#999] ml-1">{law.article_count}條</span>}
            {selectedCount > 0 && (
              <span className="ml-2 text-xs text-[#F5922A] bg-[#F5922A]/10 px-1.5 py-0.5 rounded">
                已選 {selectedCount} 條
              </span>
            )}
          </div>
          <ChevronRight className={`h-3 w-3 text-[#999] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </button>

        {isExpanded && (
          <div className="bg-[#FAFAFA] border-t border-[#E1E1E1] max-h-60 overflow-y-auto">
            {loadingArticles ? (
              <div className="flex items-center justify-center py-4 text-sm text-[#999]">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />載入條文...
              </div>
            ) : expandedArticles.length === 0 ? (
              <div className="px-3 py-3 text-xs text-[#999]">無條文資料</div>
            ) : (
              expandedArticles.map((a, ai) => {
                if (!a.no) return null
                const checked = isArticleSelected(law.law_name, a.no)
                return (
                  <label
                    key={ai}
                    className={`flex items-start gap-2 px-3 py-1.5 cursor-pointer hover:bg-white transition-colors ${
                      checked ? "bg-[#F5922A]/5" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArticleSelection(law.law_name, a)}
                      className="mt-0.5 rounded border-[#E1E1E1] text-[#F5922A] focus:ring-[#F5922A]"
                    />
                    <span className="text-xs leading-relaxed">
                      <span className="font-medium text-[#444]">{a.no}</span>
                      <span className="text-[#666]">：{a.content.slice(0, 80)}{a.content.length > 80 ? "..." : ""}</span>
                    </span>
                  </label>
                )
              })
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-[#1B2D6B]">法規引用</h2>
          <p className="text-sm text-[#666] mt-1">搜尋或瀏覽法規，勾選要引用的條文。</p>
        </div>
        {suggestions.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-[#F5922A] bg-[#F5922A]/10 px-2 py-1 rounded-full">
            <Sparkles className="h-3 w-3" /> AI 已建議
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
              {searching ? "..." : "搜尋"}
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-[#F5F1EC] text-xs font-medium text-[#666]">
                搜尋結果（點擊展開條文）
              </div>
              {searchResults.map((law, i) => renderLawItem(law, i))}
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
                  setExpandedLaw(null)
                }}
                className="flex items-center gap-1 w-full px-3 py-1.5 text-xs text-[#666] hover:bg-[#F5F1EC] border-t border-[#E1E1E1]"
              >
                <ChevronLeft className="h-3 w-3" /> 返回上層
              </button>
            )}

            <div className="max-h-72 overflow-y-auto">
              {browsingCat && catResults.length > 0 ? (
                catResults.map((law, i) => renderLawItem(law, i + 1000))
              ) : (
                currentCatChildren.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (cat.children && cat.children.length > 0) {
                        setCatPath((prev) => [...prev, cat.name])
                        setBrowsingCat(false)
                        setCatResults([])
                        setExpandedLaw(null)
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
              {currentCatChildren.length === 0 && !browsingCat && categories.length === 0 && (
                <div className="px-3 py-4 text-sm text-[#999] text-center">載入中...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected laws (1 col) */}
        <div className="lg:col-span-1">
          <div className="border border-[#E1E1E1] rounded-lg overflow-hidden lg:sticky lg:top-4">
            <div className="px-3 py-2 bg-[#1B2D6B] text-white text-sm font-medium">
              已選引用 ({selectedLaws.reduce((sum, s) => sum + s.articles.length, 0)} 條)
            </div>

            {selectedLaws.length === 0 ? (
              <div className="px-3 py-8 text-sm text-[#999] text-center">
                從左邊選取法規條文
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-[#E1E1E1]">
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
                    <div className="mt-1 space-y-0.5">
                      {law.articles.map((a, ai) => (
                        <div key={ai} className="text-xs text-[#666]">
                          <span className="font-medium text-[#F5922A]">{a.no}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => {
            const filtered = selectedLaws.filter((s) => s.articles.length > 0)
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
        </Button>
      </div>
    </div>
  )
}
