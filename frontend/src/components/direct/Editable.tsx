import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface EditableProps {
  value: string
  placeholder?: string
  multiline?: boolean
  className?: string
  recent?: boolean
  onChange: (value: string) => void
}

export default function Editable({
  value,
  placeholder = "點此編輯...",
  multiline,
  className,
  recent,
  onChange,
}: EditableProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || "")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = multiline ? textareaRef.current : inputRef.current
    if (editing && el) {
      el.focus()
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  }, [editing, multiline])

  const startEdit = () => {
    setDraft(value || "")
    setEditing(true)
  }

  const commit = () => {
    if (draft !== value) onChange(draft)
    setEditing(false)
  }
  const cancel = () => {
    setDraft(value || "")
    setEditing(false)
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          className={cn(
            "w-full bg-white border border-[#1B2D6B] rounded px-2 py-1 text-sm leading-relaxed focus:outline-none",
            className
          )}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel()
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              commit()
            }
          }}
          rows={Math.max(2, draft.split("\n").length)}
        />
      )
    }
    return (
      <input
        ref={inputRef}
        className={cn(
          "bg-white border border-[#1B2D6B] rounded px-2 py-0.5 text-sm focus:outline-none",
          className
        )}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") cancel()
        }}
      />
    )
  }

  if (!value) {
    return (
      <button
        type="button"
        className={cn(
          "text-left text-[#999] italic hover:bg-[#F5F1EC] rounded px-1 py-0.5 transition-colors",
          className
        )}
        onClick={startEdit}
      >
        {placeholder}
      </button>
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-text hover:bg-[#F5F1EC] rounded px-1 -mx-1 py-0.5 transition-colors",
        recent && "bg-[#FFF4E0]",
        className
      )}
      onClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter") startEdit()
      }}
    >
      {value}
    </span>
  )
}
