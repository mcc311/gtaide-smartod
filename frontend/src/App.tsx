import { useState, useEffect } from "react"
import Stepper from "@/components/Stepper"
import Step1Input from "@/components/Step1Input"
import Step2Intent from "@/components/Step2Intent"
import Step3Clarify from "@/components/Step2Clarify"
import Step4Content from "@/components/Step3Content"
import Step5Preview from "@/components/Step4Preview"
import type {
  IntentResult,
  PhraseResult,
  GenerateRequest,
  DocType,
  OrganNode,
  ParsedIntentResponse,
  GeneratedContentResponse,
  ReceiverType,
  ActionType,
} from "@/types"

function isoToday(): string {
  const now = new Date()
  return now.toISOString().slice(0, 10) // YYYY-MM-DD for date input
}

const defaultIntent: IntentResult = {
  sender: "",
  receiver: "",
  receiver_type: "政府機關",
  is_internal: false,
  action_type: "新案",
  purpose: "",
  subject_brief: "",
  reference_doc: undefined,
  attachments: [],
  formality: "正式",
  sender_level: 0,
  receiver_level: 0,
  sender_parent: "",
  receiver_parent: "",
  receiver_display_name: "",
  subtype: "",
}

const defaultForm: GenerateRequest = {
  intent: defaultIntent,
  subject_detail: "",
  explanation_items: [""],
  action_items: [""],
  recipients_main: [],
  recipients_cc: [],
  doc_date: isoToday(),
  doc_number: "",
  speed: "普通件",
  attachments_text: "",
}

function inferDocType(
  intent: IntentResult,
  phraseResult: PhraseResult | null
): DocType | null {
  if (intent.action_type === "會議通知") return "開會通知單"
  if (intent.action_type === "公布法令") return "令"
  if (intent.action_type === "報告") return "簽"
  if (intent.is_internal && !intent.receiver) return "簽"
  if (phraseResult) {
    if (phraseResult.direction === "平行文") return "書函"
  }
  if (intent.sender && intent.receiver) return "函"
  return null
}

const STEPS = [
  { label: "AI 分析", icon: "1" },
  { label: "確認意圖", icon: "2" },
  { label: "法規建議", icon: "3" },
  { label: "補充資訊", icon: "4" },
  { label: "編輯內容", icon: "5" },
  { label: "預覽輸出", icon: "6" },
]

export default function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [intent, setIntent] = useState<IntentResult>(defaultIntent)
  const [phraseResult, setPhraseResult] = useState<PhraseResult | null>(null)
  const [form, setForm] = useState<GenerateRequest>(defaultForm)
  const [organTree, setOrganTree] = useState<OrganNode[]>([])
  const [docTypeOverride, setDocTypeOverride] = useState<DocType | null>(null)
  const [citations, setCitations] = useState<Array<{law_name: string; article_no: string; valid: boolean}>>([])
  const [lawSuggestions, setLawSuggestions] = useState<Array<{law_name: string; articles: Array<{no: string; content: string}>; selected: boolean}>>([])

  useEffect(() => {
    fetch("/api/organs")
      .then((r) => r.json())
      .then((data: OrganNode[]) => setOrganTree(data))
      .catch(() => {})
  }, [])

  const docType = docTypeOverride ?? inferDocType(intent, phraseResult)

  const handleIntentChange = (newIntent: IntentResult) => {
    setIntent(newIntent)
    setForm((prev) => ({ ...prev, intent: newIntent }))
  }

  const handleFormChange = (newForm: GenerateRequest) => {
    setForm(newForm)
  }

  const handleDocTypeOverride = (dt: DocType) => {
    setDocTypeOverride(dt)
  }

  const applyParsedIntent = (result: ParsedIntentResponse) => {
    const newIntent: IntentResult = {
      sender: result.sender,
      receiver: result.receiver,
      receiver_type: (result.receiver_type as ReceiverType) || "政府機關",
      is_internal: result.is_internal,
      action_type: (result.action_type as ActionType) || "新案",
      purpose: result.purpose,
      subject_brief: result.subject_brief,
      reference_doc: result.reference_doc || undefined,
      attachments: result.attachments ?? [],
      formality: result.formality || "正式",
      sender_level: 0,
      receiver_level: 0,
      sender_parent: "",
      receiver_parent: "",
      receiver_display_name: result.receiver_display_name || "",
      subtype: result.subtype || "",
    }
    setIntent(newIntent)
    setForm((prev) => ({ ...prev, intent: newIntent }))
    if (result.doc_type) {
      setDocTypeOverride(result.doc_type)
    }
  }

  // Step 1: AI parse → go to confirm
  const handleParsed = (result: ParsedIntentResponse) => {
    applyParsedIntent(result)
    setCurrentStep(2)
  }

  const handleSkipToManual = () => {
    setCurrentStep(2)
  }

  // Step 2: Confirm intent → go to law suggestions
  const handleGoToLawSuggestions = async () => {
    // Fetch law suggestions
    try {
      const res = await fetch("/api/suggest-laws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          doc_type: docType,
          subtype: intent.subtype,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const suggestions = (data.suggestions || []).map((s: { law_name: string; articles: Array<{no: string; content: string}> }) => ({
          ...s,
          selected: true,
        }))
        setLawSuggestions(suggestions)
      }
    } catch {
      // Non-blocking
    }
    setCurrentStep(3)
  }

  // Step 3: Law suggestions → go to clarify
  const handleGoToClarify = () => {
    setCurrentStep(4)
  }

  const handleManualContent = () => {
    setCurrentStep(5)
  }

  // Step 4: Clarification complete
  const handleClarifyComplete = (content: GeneratedContentResponse & { citations?: Array<{law_name: string; article_no: string; valid: boolean}> }) => {
    setForm((prev) => ({
      ...prev,
      subject_detail: content.subject_detail || prev.subject_detail,
      explanation_items:
        content.explanation_items.length > 0
          ? content.explanation_items
          : prev.explanation_items,
      action_items:
        content.action_items.length > 0
          ? content.action_items
          : prev.action_items,
    }))
    if (content.citations) {
      setCitations(content.citations)
    }
    setCurrentStep(5)
  }

  const handleClarifySkip = () => {
    setCurrentStep(5)
  }

  // Step 5: Content editing
  const handlePreview = () => {
    setCurrentStep(6)
  }

  // Step 6: Preview
  const handleBackToEdit = () => {
    setCurrentStep(5)
  }

  const handleRestart = () => {
    setIntent(defaultIntent)
    setPhraseResult(null)
    setForm({ ...defaultForm, doc_date: isoToday() })
    setDocTypeOverride(null)
    setCurrentStep(1)
  }

  // Build intent dict for clarify API
  const intentDict = {
    sender: intent.sender,
    receiver: intent.receiver,
    receiver_type: intent.receiver_type,
    action_type: intent.action_type,
    purpose: intent.purpose,
    subject_brief: intent.subject_brief,
    reference_doc: intent.reference_doc ?? "",
    attachments: intent.attachments,
    receiver_display_name: intent.receiver_display_name,
  }

  const phrasesDict: Record<string, string> = phraseResult?.phrases
    ? Object.fromEntries(
        Object.entries(phraseResult.phrases).map(([k, v]) => [k, String(v)])
      )
    : {}

  return (
    <div className="min-h-screen bg-[#F5F1EC] flex flex-col">
      <header className="border-b border-[#E1E1E1] bg-[#F5F1EC] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/gtaide_logo.svg" alt="GTAIDE" className="h-7" />
            <div className="hidden sm:block h-5 w-px bg-[#E1E1E1]" />
            <span className="hidden sm:inline text-sm font-medium text-[#1B2D6B]">SmartOD 智慧公文系統</span>
          </div>
          {docType && (
            <div className="hidden sm:block text-sm text-[#666]">
              文別：<span className="font-medium text-[#1B2D6B]">{docType}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Stepper currentStep={currentStep} steps={STEPS} />
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-12 flex-1">
        {currentStep === 1 && (
          <Step1Input onParsed={handleParsed} onSkip={handleSkipToManual} />
        )}

        {currentStep === 2 && (
          <Step2Intent
            intent={intent}
            onIntentChange={handleIntentChange}
            phraseResult={phraseResult}
            onPhraseResultChange={setPhraseResult}
            organTree={organTree}
            docType={docType}
            onDocTypeOverride={handleDocTypeOverride}
            onGenerate={handleGoToLawSuggestions}
            onManual={handleManualContent}
          />
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-[#1B2D6B]">法規引用建議</h2>
            <p className="text-sm text-[#666]">
              系統根據公文意圖自動搜尋相關法規並預選。你也可以搜尋其他法規加入。
            </p>

            {/* Selected laws */}
            <div className="space-y-2">
              {lawSuggestions.map((s, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  s.selected ? "border-[#F5922A]/30 bg-[#F5922A]/5" : "border-[#E1E1E1] bg-white"
                }`}>
                  <input
                    type="checkbox"
                    checked={s.selected}
                    onChange={() => {
                      setLawSuggestions(prev => prev.map((p, j) =>
                        j === i ? { ...p, selected: !p.selected } : p
                      ))
                    }}
                    className="mt-0.5 rounded border-[#E1E1E1] text-[#F5922A] focus:ring-[#F5922A]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#222]">{s.law_name}</div>
                    {s.articles.map((a, ai) => (
                      <div key={ai} className="text-xs text-[#666] mt-1">
                        <span className="font-medium text-[#444]">{a.no}</span>：{a.content}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {lawSuggestions.length === 0 && (
                <div className="text-sm text-[#999] py-4 text-center">未找到相關法規建議，可自行搜尋加入</div>
              )}
            </div>

            {/* Search bar */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="搜尋法規名稱，例如「行政程序法」「勞工保險」"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-[#E1E1E1] focus:border-[#1B2D6B] focus:ring-1 focus:ring-[#1B2D6B]/10 outline-none"
                  onKeyDown={async (e) => {
                    if (e.key !== "Enter") return
                    const q = (e.target as HTMLInputElement).value.trim()
                    if (!q) return
                    try {
                      const res = await fetch("/api/suggest-laws", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ intent: { subject_brief: q }, doc_type: "", subtype: "" }),
                      })
                      if (res.ok) {
                        const data = await res.json()
                        const newSugs = (data.suggestions || [])
                          .filter((s: { law_name: string }) => !lawSuggestions.some(existing => existing.law_name === s.law_name))
                          .map((s: { law_name: string; articles: Array<{no: string; content: string}> }) => ({
                            ...s,
                            selected: true,
                          }))
                        if (newSugs.length > 0) {
                          setLawSuggestions(prev => [...prev, ...newSugs])
                        }
                      }
                    } catch { /* ignore */ }
                    ;(e.target as HTMLInputElement).value = ""
                  }}
                />
              </div>
              <p className="text-xs text-[#999]">輸入關鍵字後按 Enter 搜尋</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleGoToClarify}
                className="flex-1 px-4 py-2.5 bg-[#F5922A] hover:bg-[#D47B22] text-white rounded-full font-medium text-sm"
              >
                下一步：補充資訊
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 border border-[#1B2D6B] text-[#1B2D6B] hover:bg-[#1B2D6B]/5 rounded-full font-medium text-sm"
              >
                上一步
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <Step3Clarify
            intent={intentDict}
            phrases={phrasesDict}
            docType={docType ?? "函"}
            direction={phraseResult?.direction ?? "平行文"}
            subtype={intent.subtype}
            onComplete={handleClarifyComplete}
            onSkip={handleClarifySkip}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step4Content
            docType={docType}
            form={form}
            onFormChange={handleFormChange}
            onPreview={handlePreview}
            onBack={() => setCurrentStep(4)}
            citations={citations}
          />
        )}

        {currentStep === 6 && (
          <Step5Preview
            intent={intent}
            form={form}
            onBackToEdit={handleBackToEdit}
            onRestart={handleRestart}
          />
        )}
      </main>

      <footer className="border-t border-[#E1E1E1] bg-[#F5F1EC] mt-auto py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-8 sm:gap-16">
            <div>
              <p className="text-[11px] text-[#999] mb-3 uppercase tracking-wider font-medium">Powered by</p>
              <img src="/taide_logo.png" alt="TAIDE" className="h-10 object-contain" />
            </div>
            <div>
              <p className="text-[11px] text-[#999] mb-3 uppercase tracking-wider font-medium">Supported by</p>
              <div className="flex items-center gap-8">
                <img src="/nstc_logo.svg" alt="國科會 NSTC" className="h-10 object-contain" />
                <img src="/niar_logo.png" alt="國研院 NARLabs" className="h-10 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
