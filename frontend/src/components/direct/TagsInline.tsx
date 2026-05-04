import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface TagsInlineProps {
  tags: string[]
  placeholder?: string
  onChange: (tags: string[]) => void
}

export default function TagsInline({ tags, placeholder = "+ 新增", onChange }: TagsInlineProps) {
  const [adding, setAdding] = useState(false)
  const [val, setVal] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const commit = () => {
    if (val.trim()) onChange([...tags, val.trim()])
    setVal("")
    setAdding(false)
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="inline-flex items-center gap-1 bg-[#F5F1EC] text-[#222] text-xs rounded-full px-2 py-0.5"
        >
          {t}
          <button
            type="button"
            className="hover:text-[#D5705D]"
            onClick={() => onChange(tags.filter((_, j) => j !== i))}
            aria-label="移除"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          ref={inputRef}
          className="text-xs border border-[#1B2D6B] rounded px-1.5 py-0.5 focus:outline-none w-24"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") {
              setVal("")
              setAdding(false)
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="text-xs text-[#666] hover:text-[#1B2D6B] px-1.5 py-0.5"
          onClick={() => setAdding(true)}
        >
          {placeholder}
        </button>
      )}
    </span>
  )
}
