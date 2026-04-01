import { useState, useRef, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Search, Check } from "lucide-react"
import type { OrganNode } from "@/types"

export interface OrganSelectInfo {
  name: string
  receiverType?: string
  level?: number
  parentContext?: string
  isCustom?: boolean
}

interface OrganSelectorProps {
  label: string
  value: string
  onChange: (info: OrganSelectInfo) => void
  organTree: OrganNode[]
  placeholder?: string
}

interface FlatNode extends OrganNode {
  _parentPath: string
}

function flattenNodes(nodes: OrganNode[], parentPath: string = ""): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    if (!node.is_custom) {
      result.push({ ...node, _parentPath: parentPath })
    }
    if (node.children.length > 0) {
      const childPath = parentPath ? `${parentPath} > ${node.name}` : node.name
      result.push(...flattenNodes(node.children, childPath))
    }
  }
  return result
}

export default function OrganSelector({
  label: _label,
  value,
  onChange,
  organTree,
  placeholder,
}: OrganSelectorProps) {
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<OrganNode[]>([])
  const [searchText, setSearchText] = useState("")
  const [customInputNode, setCustomInputNode] = useState<OrganNode | null>(null)
  const [customInputText, setCustomInputText] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setCustomInputNode(null)
        setCustomInputText("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Focus custom input when it appears
  useEffect(() => {
    if (customInputNode && customInputRef.current) {
      customInputRef.current.focus()
    }
  }, [customInputNode])

  const currentChildren =
    path.length === 0 ? organTree : path[path.length - 1].children

  const allFlat = useMemo(() => flattenNodes(organTree), [organTree])

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return []
    const q = searchText.trim().toLowerCase()
    return allFlat.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (n.short_name && n.short_name.toLowerCase().includes(q))
    ).slice(0, 20)
  }, [searchText, allFlat])

  const getParentPath = (excludeLast = false) => {
    const names = path.map((p) => p.name)
    return (excludeLast ? names.slice(0, -1) : names).join(" > ")
  }

  const selectNode = (node: OrganNode, parentPath?: string) => {
    onChange({
      name: node.name,
      receiverType: node.receiver_type,
      level: node.level,
      parentContext: parentPath ?? getParentPath(),
      isCustom: false,
    })
    setSearchText("")
    setPath([])
    setOpen(false)
    setCustomInputNode(null)
    setCustomInputText("")
  }

  const drillDown = (node: OrganNode) => {
    setPath((prev) => [...prev, node])
    setSearchText("")
    setCustomInputNode(null)
    setCustomInputText("")
  }

  const handleSelect = (node: OrganNode) => {
    if (node.is_custom) {
      setCustomInputNode(node)
      setCustomInputText("")
      return
    }
    // receiver_type nodes like 人民/企業/學校 need a name input (except 公眾)
    if (node.receiver_type && node.receiver_type !== "公眾" && node.receiver_type !== "政府機關") {
      setCustomInputNode(node)
      setCustomInputText("")
      return
    }
    if (node.children.length > 0 && !node.receiver_type) {
      drillDown(node)
    } else {
      selectNode(node)
    }
  }

  const handleCustomConfirm = () => {
    if (!customInputNode || !customInputText.trim()) return
    onChange({
      name: customInputText.trim(),
      receiverType: customInputNode.receiver_type,
      level: customInputNode.level,
      parentContext: customInputNode.parent_context,
      isCustom: true,
    })
    setSearchText("")
    setPath([])
    setOpen(false)
    setCustomInputNode(null)
    setCustomInputText("")
  }

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCustomConfirm()
    } else if (e.key === "Escape") {
      setCustomInputNode(null)
      setCustomInputText("")
    }
  }

  const handleBack = () => {
    setPath((prev) => prev.slice(0, -1))
    setCustomInputNode(null)
    setCustomInputText("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearchText(v)
    onChange({ name: v })
    if (!open) setOpen(true)
    setCustomInputNode(null)
    setCustomInputText("")
  }

  const handleFocus = () => {
    setOpen(true)
  }

  const isSearching = searchText.trim().length > 0

  const categoryColors: Record<string, string> = {
    中央機關: "bg-blue-50 hover:bg-blue-100 border-blue-100",
    地方政府: "bg-green-50 hover:bg-green-100 border-green-100",
    其他對象: "bg-amber-50 hover:bg-amber-100 border-amber-100",
  }

  const getCategoryColor = (name: string) => {
    if (path.length === 0) return categoryColors[name] ?? "hover:bg-gray-100"
    const root = path[0].name
    const colors: Record<string, string> = {
      中央機關: "hover:bg-blue-50",
      地方政府: "hover:bg-green-50",
      其他對象: "hover:bg-amber-50",
    }
    return colors[root] ?? "hover:bg-gray-100"
  }

  const getCustomLabel = (node: OrganNode): string => {
    if (node.parent_context) {
      return `${node.parent_context}所屬機關名稱：`
    }
    if (node.receiver_type === "自訂") {
      return "自訂對象名稱："
    }
    return "機關名稱："
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          value={open ? searchText || value : value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="pr-8"
        />
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {open && organTree.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-72 sm:max-h-80 overflow-hidden flex flex-col">
          {/* Breadcrumbs */}
          {path.length > 0 && !isSearching && (
            <div className="flex items-center gap-1 px-3 py-2 border-b bg-gray-50 text-xs text-muted-foreground flex-shrink-0 overflow-x-auto">
              <button
                type="button"
                className="flex items-center gap-0.5 hover:text-foreground transition-colors"
                onClick={() => { setPath([]); setCustomInputNode(null); setCustomInputText(""); }}
              >
                全部
              </button>
              {path.map((p, i) => (
                <span key={i} className="flex items-center gap-0.5">
                  <ChevronRight className="h-3 w-3" />
                  <button
                    type="button"
                    className="hover:text-foreground transition-colors"
                    onClick={() => { setPath((prev) => prev.slice(0, i + 1)); setCustomInputNode(null); setCustomInputText(""); }}
                  >
                    {p.name}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Back + select current */}
          {path.length > 0 && !isSearching && (
            <div className="flex items-center border-b flex-shrink-0">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100"
                onClick={handleBack}
              >
                <ChevronLeft className="h-4 w-4" />
                返回
              </button>
              <button
                type="button"
                className="ml-auto px-3 py-2 text-xs text-[#F5922A] hover:bg-[#F5922A]/5 font-medium"
                onClick={() => selectNode(path[path.length - 1], getParentPath(true))}
              >
                選取「{path[path.length - 1].name}」
              </button>
            </div>
          )}

          {/* Custom input inline */}
          {customInputNode && !isSearching && (
            <div className="px-3 py-2 border-b bg-yellow-50 flex-shrink-0">
              <div className="text-xs text-muted-foreground mb-1">
                {getCustomLabel(customInputNode)}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  ref={customInputRef}
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  onKeyDown={handleCustomKeyDown}
                  placeholder="請輸入名稱"
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 shrink-0"
                  onClick={handleCustomConfirm}
                  disabled={!customInputText.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="overflow-y-auto flex-1">
            {isSearching ? (
              searchResults.length > 0 ? (
                searchResults.map((node) => (
                  <button
                    key={node.name}
                    type="button"
                    className="flex items-center justify-between w-full px-3 py-2 min-h-[44px] text-sm text-left hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      onChange({
                        name: node.name,
                        receiverType: node.receiver_type,
                        level: node.level,
                        parentContext: node._parentPath || node.parent_context || "",
                        isCustom: false,
                      })
                      setSearchText("")
                      setPath([])
                      setOpen(false)
                    }}
                  >
                    <div className="min-w-0">
                      <div>{node.name}</div>
                      {node._parentPath && (
                        <div className="text-xs text-muted-foreground truncate">{node._parentPath}</div>
                      )}
                    </div>
                    {node.receiver_type && (
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {node.receiver_type}
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  無符合結果
                </div>
              )
            ) : (
              currentChildren.map((node) => (
                <button
                  key={node.name}
                  type="button"
                  className={`flex items-center justify-between w-full px-3 py-2 min-h-[44px] text-sm text-left transition-colors ${
                    node.is_custom
                      ? "bg-yellow-50 hover:bg-yellow-100 text-amber-700 border-t border-yellow-100"
                      : getCategoryColor(node.name)
                  }`}
                  onClick={() => handleSelect(node)}
                >
                  <span>
                    {node.is_custom && "✎ "}
                    {node.name}
                  </span>
                  {!node.is_custom && node.children.length > 0 && !node.receiver_type && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  {node.receiver_type && !node.is_custom && (
                    <span className="text-xs text-muted-foreground">
                      選取
                    </span>
                  )}
                  {node.is_custom && (
                    <span className="text-xs text-amber-600">
                      自訂
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
