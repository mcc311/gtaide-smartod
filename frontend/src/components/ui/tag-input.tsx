import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

const SEPARATORS = [",", "、"]

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [input, setInput] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addTag = (text: string) => {
    const trimmed = text.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (input.trim()) {
        addTag(input)
        setInput("")
      }
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Check if the last character is a separator
    if (SEPARATORS.some((sep) => raw.endsWith(sep))) {
      const text = raw.slice(0, -1)
      if (text.trim()) {
        addTag(text)
      }
      setInput("")
      return
    }
    setInput(raw)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text")
    const parts = pasted.split(/[,、]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return
    const newTags = [...value]
    for (const part of parts) {
      if (!newTags.includes(part)) {
        newTags.push(part)
      }
    }
    onChange(newTags)
    setInput("")
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <Badge key={i} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button
            type="button"
            className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(i)
            }}
            aria-label={`移除 ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground text-sm"
      />
    </div>
  )
}
