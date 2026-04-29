import { useState } from "react"
import Editable from "./Editable"
import { Plus, Trash2 } from "lucide-react"

interface ListSectionProps {
  items: string[]
  placeholder: string
  onChange: (items: string[]) => void
}

function makeId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function ListSection({ items, placeholder, onChange }: ListSectionProps) {
  const [ids, setIds] = useState<string[]>(() => items.map(() => makeId()))

  // Keep ids array length in sync with items length (deriving state from props)
  if (ids.length !== items.length) {
    if (ids.length < items.length) {
      const extra = Array.from({ length: items.length - ids.length }, () => makeId())
      setIds([...ids, ...extra])
    } else {
      setIds(ids.slice(0, items.length))
    }
  }

  const updateAt = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next)
  }
  const removeAt = (i: number) => {
    setIds((prev) => prev.filter((_, j) => j !== i))
    onChange(items.filter((_, j) => j !== i))
  }
  const add = () => onChange([...items, ""])

  if (items.length === 0) {
    return (
      <button
        type="button"
        className="text-left text-sm text-[#999] italic hover:bg-[#F5F1EC] rounded px-1 py-0.5"
        onClick={add}
      >
        {placeholder}
      </button>
    )
  }

  return (
    <ol className="space-y-2 list-none">
      {items.map((it, i) => (
        <li key={ids[i] ?? `tmp-${i}`} className="flex gap-2 items-start text-sm leading-relaxed">
          <span className="text-[#999] shrink-0 w-6 text-right pt-0.5">
            {items.length > 1 ? `${i + 1}.` : ""}
          </span>
          <div className="flex-1 min-w-0">
            <Editable multiline value={it} placeholder="點此編輯..." onChange={(v) => updateAt(i, v)} />
          </div>
          {items.length > 1 && (
            <button
              type="button"
              className="shrink-0 text-[#999] hover:text-[#D5705D] p-1"
              onClick={() => removeAt(i)}
              aria-label="移除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
      <li>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-[#666] hover:text-[#1B2D6B] px-1 py-1"
          onClick={add}
        >
          <Plus className="h-3 w-3" /> 新增段落
        </button>
      </li>
    </ol>
  )
}
