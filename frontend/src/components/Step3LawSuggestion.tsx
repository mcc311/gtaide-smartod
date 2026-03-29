import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronRight, ChevronLeft, X, Sparkles, ArrowLeft, ArrowRight } from "lucide-react"

interface LawArticle {
  no: string
  content: string
}

interface LawSuggestion {
  law_name: string
  category?: string
  article_count?: number
  articles: LawArticle[]
}

interface SelectedLaw {
  law_name: string
  articles: LawArticle[]
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

  // Initialize with AI suggestions
  useEffect(() => {
    const initial = suggestions
      .filter((s) => s.articles.length > 0)
      .map((s) => ({ law_name: s.law_name, articles: s.articles }))
    setSelectedLaws(initial)
  }, [suggestions])

  // Load categories on mount
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
    try {
      const res = await fetch("/api/suggest-laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: { subject_brief: catName },
          doc_type: "",
          subtype: "",
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCatResults(data.suggestions || [])
        setBrowsingCat(true)
      }
    } catch { /* ignore */ }
  }

  const addLaw = (law: LawSuggestion) => {
    if (selectedLaws.some((s) => s.law_name === law.law_name)) return
    setSelectedLaws((prev) => [...prev, { law_name: law.law_name, articles: law.articles }])
  }

  const removeLaw = (lawName: string) => {
    setSelectedLaws((prev) => prev.filter((s) => s.law_name !== lawName))
  }

  const isSelected = (lawName: string) => selectedLaws.some((s) => s.law_name === lawName)

  const currentCatChildren = catPath.length === 0
    ? categories
    : (() => {
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
      <h2 className="text-lg font-medium text-[#1B2D6B]">法規引用</h2>
      <p className="text-sm text-[#666]">
        AI 已根據公文意圖預選相關法規。你也可以搜尋或瀏覽法規分類來新增。
      </p>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Browse + Search */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="搜尋法規名稱，例如「行政程序法」「勞工保險」"
                className="pr-9 rounded-lg border-[#E1E1E1] focus:border-[#1B2D6B]"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999] pointer-events-none" />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchText.trim() || searching}
              size="sm"
              className="bg-[#1B2D6B] hover:bg-[#152350] text-white rounded-lg"
            >
              搜尋
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-[#F5F1EC] text-xs font-medium text-[#666]">搜尋結果</div>
              {searchResults.map((law, i) => (
                <button
                  key={i}
                  onClick={() => addLaw(law)}
                  disabled={isSelected(law.law_name)}
                  className={`w-full text-left px-3 py-2 text-sm border-t border-[#E1E1E1] transition-colors ${
                    isSelected(law.law_name)
                      ? "bg-[#F5922A]/5 text-[#999]"
                      : "hover:bg-[#F5F1EC]"
                  }`}
                >
                  <div className="font-medium text-[#222]">
                    {law.law_name}
                    {isSelected(law.law_name) && <span className="ml-2 text-xs text-[#F5922A]">已選</span>}
                  </div>
                  {law.articles.slice(0, 2).map((a, ai) => (
                    <div key={ai} className="text-xs text-[#666] mt-0.5 truncate">
                      {a.no}：{a.content}
                    </div>
                  ))}
                </button>
              ))}
            </div>
          )}

          {/* Category browser */}
          <div className="border border-[#E1E1E1] rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-[#F5F1EC] text-xs font-medium text-[#666] flex items-center gap-1">
              法規分類瀏覽
              {catPath.length > 0 && (
                <span className="text-[#999]">
                  {" "}— {catPath.join(" > ")}
                </span>
              )}
            </div>

            {catPath.length > 0 && (
              <button
                onClick={() => {
                  setCatPath((prev) => prev.slice(0, -1))
                  setCatResults([])
                  setBrowsingCat(false)
                }}
                className="flex items-center gap-1 w-full px-3 py-2 text-sm text-[#666] hover:bg-[#F5F1EC] border-t border-[#E1E1E1]"
              >
                <ChevronLeft className="h-3 w-3" /> 返回
              </button>
            )}

            {/* Category list or search results within category */}
            {browsingCat && catResults.length > 0 ? (
              catResults.map((law, i) => (
                <button
                  key={i}
                  onClick={() => addLaw(law)}
                  disabled={isSelected(law.law_name)}
                  className={`w-full text-left px-3 py-2 text-sm border-t border-[#E1E1E1] transition-colors ${
                    isSelected(law.law_name) ? "bg-[#F5922A]/5 text-[#999]" : "hover:bg-[#F5F1EC]"
                  }`}
                >
                  <span className="font-medium">{law.law_name}</span>
                  {isSelected(law.law_name) && <span className="ml-2 text-xs text-[#F5922A]">已選</span>}
                </button>
              ))
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {currentCatChildren.map((cat, i) => (
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
                    className="flex items-center justify-between w-full px-3 py-2 text-sm border-t border-[#E1E1E1] hover:bg-[#F5F1EC] transition-colors"
                  >
                    <span>{cat.name}</span>
                    <span className="flex items-center gap-1 text-xs text-[#999]">
                      {cat.count}部
                      {cat.children && cat.children.length > 0 && <ChevronRight className="h-3 w-3" />}
                    </span>
                  </button>
                ))}
                {currentCatChildren.length === 0 && (
                  <div className="px-3 py-4 text-sm text-[#999] text-center">載入中...</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected laws panel */}
        <div className="lg:w-72 shrink-0">
          <div className="border border-[#E1E1E1] rounded-lg overflow-hidden sticky top-4">
            <div className="px-3 py-2 bg-[#1B2D6B] text-white text-sm font-medium flex items-center justify-between">
              <span>已選法規 ({selectedLaws.length})</span>
              {suggestions.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <Sparkles className="h-3 w-3" /> AI 建議
                </span>
              )}
            </div>

            {selectedLaws.length === 0 ? (
              <div className="px-3 py-6 text-sm text-[#999] text-center">
                尚未選取法規<br />
                <span className="text-xs">可搜尋或從分類瀏覽加入</span>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {selectedLaws.map((law, i) => (
                  <div key={i} className="px-3 py-2 border-t border-[#E1E1E1]">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm font-medium text-[#222]">{law.law_name}</span>
                      <button
                        onClick={() => removeLaw(law.law_name)}
                        className="shrink-0 p-0.5 text-[#999] hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {law.articles.map((a, ai) => (
                      <div key={ai} className="text-xs text-[#666] mt-1 leading-relaxed">
                        <span className="font-medium text-[#444]">{a.no}</span>：{a.content.slice(0, 60)}...
                      </div>
                    ))}
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
          onClick={() => onNext(selectedLaws)}
          className="flex-1 bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full font-medium"
          size="lg"
        >
          <ArrowRight className="h-4 w-4" />
          下一步：補充資訊
        </Button>
        <Button
          variant="outline"
          onClick={onSkip}
          className="border-[#E1E1E1] text-[#666] rounded-full"
          size="lg"
        >
          跳過
        </Button>
        <Button
          variant="outline"
          onClick={onBack}
          className="border-[#1B2D6B] text-[#1B2D6B] rounded-full"
          size="lg"
        >
          <ArrowLeft className="h-4 w-4" />
          上一步
        </Button>
      </div>
    </div>
  )
}
