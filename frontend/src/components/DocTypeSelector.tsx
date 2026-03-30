import { useState, useRef, useEffect } from "react"
import { ChevronRight, ChevronLeft, Check } from "lucide-react"
import { SUBTYPE_OPTIONS } from "@/types"
import type { DocType } from "@/types"

interface DocTypeSelectorProps {
  docType: DocType | null
  subtype: string
  onSelect: (docType: DocType, subtype: string) => void
}

const DOC_TYPES: DocType[] = ["函", "書函", "簽", "便簽", "公告", "令", "開會通知單"]

export default function DocTypeSelector({ docType, subtype, onSelect }: DocTypeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [drillType, setDrillType] = useState<DocType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setDrillType(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const displayText = docType
    ? subtype
      ? `${docType} / ${subtype}`
      : docType
    : "選擇公文類型"

  const handleSelectType = (dt: DocType) => {
    const subtypes = SUBTYPE_OPTIONS[dt] || []
    if (subtypes.length > 0) {
      setDrillType(dt)
    } else {
      onSelect(dt, "")
      setOpen(false)
      setDrillType(null)
    }
  }

  const handleSelectSubtype = (st: string) => {
    if (drillType) {
      onSelect(drillType, st)
    }
    setOpen(false)
    setDrillType(null)
  }

  const handleSelectTypeOnly = () => {
    if (drillType) {
      onSelect(drillType, "")
    }
    setOpen(false)
    setDrillType(null)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setDrillType(null) }}
        className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
          open ? "border-[#1B2D6B] ring-1 ring-[#1B2D6B]/10" : "border-[#E1E1E1]"
        } ${docType ? "text-[#222]" : "text-[#999]"}`}
      >
        {displayText}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[#E1E1E1] bg-white shadow-lg overflow-hidden">
          {drillType ? (
            <>
              {/* Drill down into subtypes */}
              <div className="flex items-center border-b border-[#E1E1E1]">
                <button
                  type="button"
                  onClick={() => setDrillType(null)}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-[#666] hover:bg-[#F5F1EC]"
                >
                  <ChevronLeft className="h-3 w-3" /> 返回
                </button>
                <button
                  type="button"
                  onClick={handleSelectTypeOnly}
                  className="ml-auto px-3 py-2 text-xs text-[#F5922A] hover:bg-[#F5922A]/5 font-medium"
                >
                  只選「{drillType}」（不指定子類型）
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {(SUBTYPE_OPTIONS[drillType] || []).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleSelectSubtype(st)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors ${
                      docType === drillType && subtype === st
                        ? "bg-[#F5922A]/5 text-[#F5922A]"
                        : "hover:bg-[#F5F1EC]"
                    }`}
                  >
                    <span>{st}</span>
                    {docType === drillType && subtype === st && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Top level doc types */
            <div className="max-h-48 overflow-y-auto">
              {DOC_TYPES.map((dt) => {
                const subtypes = SUBTYPE_OPTIONS[dt] || []
                const isSelected = docType === dt
                return (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => handleSelectType(dt)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors ${
                      isSelected ? "bg-[#F5922A]/5" : "hover:bg-[#F5F1EC]"
                    }`}
                  >
                    <span className={isSelected ? "text-[#F5922A] font-medium" : ""}>
                      {dt}
                      {isSelected && subtype && (
                        <span className="text-xs text-[#F5922A]/70 ml-1">/ {subtype}</span>
                      )}
                    </span>
                    {subtypes.length > 0 ? (
                      <ChevronRight className="h-3 w-3 text-[#999]" />
                    ) : isSelected ? (
                      <Check className="h-3.5 w-3.5 text-[#F5922A]" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
