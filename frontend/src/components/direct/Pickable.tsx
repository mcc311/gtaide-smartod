import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PickableProps {
  value: string
  options: string[]
  className?: string
  recent?: boolean
  onChange: (value: string) => void
}

export default function Pickable({ value, options, className, recent, onChange }: PickableProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded border border-transparent hover:border-[#E1E1E1] hover:bg-[#F5F1EC] transition-colors text-sm",
          recent && "bg-[#FFF4E0]",
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {value}
        <ChevronDown className="h-3 w-3 text-[#999]" />
      </button>
      {open && (
        <div role="listbox" className="absolute z-20 mt-1 min-w-[120px] bg-white border border-[#E1E1E1] rounded-md shadow-lg py-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === value}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm hover:bg-[#F5F1EC]",
                opt === value && "text-[#1B2D6B] font-medium"
              )}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
            >
              <span>{opt}</span>
              {opt === value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}
