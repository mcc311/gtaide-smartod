import { useState, useEffect } from "react"
import Stepper from "@/components/Stepper"
import Step1Input from "@/components/Step1Input"
import Step2Intent from "@/components/Step2Intent"
import Step3LawSuggestion from "@/components/Step3LawSuggestion"
import Step4Clarify from "@/components/Step2Clarify"
import Step5Content from "@/components/Step3Content"
import Step6Preview from "@/components/Step4Preview"
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

  // Find organ path in tree (e.g., "中央機關 > 行政院 > 勞動部")
  const findOrganPath = (name: string, nodes: OrganNode[], trail: string[] = []): { path: string; level: number } | null => {
    for (const n of nodes) {
      const currentTrail = [...trail, n.name]
      if (n.name === name) {
        return {
          path: currentTrail.slice(0, -1).join(" > "), // parent path (without self)
          level: n.level ?? currentTrail.length - 1,
        }
      }
      if (n.children.length > 0) {
        const found = findOrganPath(name, n.children, currentTrail)
        if (found) return found
      }
    }
    return null
  }

  const applyParsedIntent = (result: ParsedIntentResponse) => {
    const senderInfo = findOrganPath(result.sender, organTree)
    const receiverInfo = findOrganPath(result.receiver, organTree)

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
      sender_level: senderInfo?.level ?? 0,
      receiver_level: receiverInfo?.level ?? 0,
      sender_parent: senderInfo?.path ?? "",
      receiver_parent: receiverInfo?.path ?? "",
      receiver_display_name: result.receiver_display_name || "",
      subtype: result.subtype || "",
      confident: result.confident,
      reasoning: result.reasoning,
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
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="border-b border-[#E1E1E1] bg-white shrink-0 z-50">
        <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/gtaide_logo.svg" alt="GTAIDE" className="h-8" />
            <div className="hidden sm:block h-6 w-px bg-[#E1E1E1]" />
            <span className="hidden sm:inline text-lg font-semibold text-[#1B2D6B]">SmartOD 智慧公文系統</span>
          </div>
        </div>
      </header>

      {/* Mobile stepper */}
      <div className="lg:hidden px-4 py-3 shrink-0 bg-[#F5F1EC]">
        <Stepper currentStep={currentStep} steps={STEPS} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — fixed height, no scroll with page */}
        <aside className="hidden lg:flex lg:flex-col w-52 shrink-0 border-r border-[#E1E1E1] bg-white px-5 py-6 overflow-y-auto">
          <Stepper currentStep={currentStep} steps={STEPS} />
          {docType && (
            <div className="mt-8 pt-4 border-t border-[#E1E1E1]">
              <div className="text-xs text-[#999]">公文類型</div>
              <div className="text-sm font-medium text-[#1B2D6B] mt-1">{docType}</div>
              {intent.subtype && (
                <div className="text-xs text-[#F5922A] mt-0.5">{intent.subtype}</div>
              )}
            </div>
          )}
          {intent.sender && (
            <div className="mt-4">
              <div className="text-xs text-[#999]">發文機關</div>
              <div className="text-sm text-[#222] mt-0.5">{intent.sender}</div>
            </div>
          )}
          {phraseResult && (
            <div className="mt-4 pt-4 border-t border-[#E1E1E1] space-y-1.5">
              <div className="text-xs text-[#999] font-medium">公文用語</div>
              {Object.entries(phraseResult.phrases)
                .filter(([key]) => !["行文性質"].includes(key))
                .map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-[#999]">{key}</span>
                    <span className="text-[#222]">{String(val) || "—"}</span>
                  </div>
                ))}
              {phraseResult.opening && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#999]">開頭語</span>
                  <span className="text-[#222]">{phraseResult.opening}</span>
                </div>
              )}
              {phraseResult.expectation && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#999]">期望語</span>
                  <span className="text-[#222]">{phraseResult.expectation}</span>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main + Footer column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-[#F5F1EC] px-6 lg:px-10 py-6">
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
          <Step3LawSuggestion
            suggestions={lawSuggestions}
            onNext={(selectedLaws) => {
              setLawSuggestions(selectedLaws.map(s => ({ ...s, selected: true })))
              handleGoToClarify()
            }}
            onBack={() => setCurrentStep(2)}
            onSkip={handleGoToClarify}
          />
        )}

        {currentStep === 4 && (
          <Step4Clarify
            intent={intentDict}
            phrases={phrasesDict}
            docType={docType ?? "函"}
            direction={phraseResult?.direction ?? "平行文"}
            subtype={intent.subtype}
            selectedLaws={lawSuggestions.filter(s => s.selected).map(s => ({ law_name: s.law_name, articles: s.articles }))}
            onComplete={handleClarifyComplete}
            onSkip={handleClarifySkip}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5Content
            docType={docType}
            form={form}
            onFormChange={handleFormChange}
            onPreview={handlePreview}
            onBack={() => setCurrentStep(4)}
            citations={citations}
          />
        )}

        {currentStep === 6 && (
          <Step6Preview
            intent={intent}
            form={form}
            onBackToEdit={handleBackToEdit}
            onRestart={handleRestart}
          />
        )}
        </main>

        {/* Footer — pinned at bottom */}
        <footer className="hidden lg:flex items-center gap-8 px-6 lg:px-10 py-2 border-t border-[#E1E1E1] bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#999] uppercase tracking-wider">Powered by</span>
            <img src="/taide_logo.png" alt="TAIDE" className="h-6 object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#999] uppercase tracking-wider">Supported by</span>
            <img src="/nstc_logo.svg" alt="國科會" className="h-6 object-contain" />
            <img src="/niar_logo.png" alt="國研院" className="h-6 object-contain" />
          </div>
        </footer>
        </div>
      </div>
    </div>
  )
}
