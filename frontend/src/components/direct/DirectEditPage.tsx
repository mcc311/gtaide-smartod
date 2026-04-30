import { useEffect, useState } from "react"
import { useDirectDocState } from "./useDirectDocState"
import DocCanvas from "./DocCanvas"
import OnboardingOverlay from "./OnboardingOverlay"
import AiPanel from "./AiPanel"
import LawSearchModal from "./LawSearchModal"
import Header from "./Header"
import ExportModal from "./ExportModal"
import type { OrganNode, GenerateRequest, IntentResult } from "@/types"
import type { UseDirectDocStateReturn } from "./useDirectDocState"

function buildGenerateRequest(
  hook: UseDirectDocStateReturn
): { intent: IntentResult; form: GenerateRequest } | null {
  const merged = hook.mergedIntent
  if (!merged) return null
  const s = hook.state
  const form: GenerateRequest = {
    intent: merged,
    subject_detail: s.subject_detail,
    explanation_items: s.explanation_items,
    action_items: s.action_items,
    recipients_main: s.recipients_main,
    recipients_cc: s.recipients_cc,
    doc_date: s.doc_date,
    doc_number: s.doc_number,
    speed: s.speed,
    attachments_text: s.attachments.join("、"),
    meeting_time: s.meeting_time || undefined,
    meeting_place: s.meeting_place || undefined,
    meeting_chair: s.meeting_chair || undefined,
    meeting_contact: s.meeting_contact || undefined,
    meeting_contact_phone: s.meeting_contact_phone || undefined,
    meeting_attendees: s.meeting_attendees.length ? s.meeting_attendees : undefined,
    meeting_observers: s.meeting_observers.length ? s.meeting_observers : undefined,
    meeting_notes: s.meeting_notes || undefined,
  }
  return { intent: merged, form }
}

export default function DirectEditPage() {
  const hook = useDirectDocState()
  const { state } = hook
  const [organTree, setOrganTree] = useState<OrganNode[]>([])
  const [lawSearchOpen, setLawSearchOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  useEffect(() => {
    fetch("/api/organs")
      .then((r) => r.json())
      .then((data: OrganNode[]) => setOrganTree(data))
      .catch(() => {})
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F5F1EC] relative">
      <Header canUndo={hook.canUndo} onUndo={hook.undo} onRestart={hook.reset} onExport={() => setExportOpen(true)} />

      {(state.phase === "onboarding" || state.phase === "parsing") && (
        <OnboardingOverlay
          onSubmit={hook.onSubmitOnboarding}
          onBlank={() => hook.setPhase("ready")}
          loading={state.phase === "parsing"}
        />
      )}

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">
        <section className="overflow-y-auto p-6 lg:p-10">
          <DocCanvas hook={hook} organTree={organTree} />
        </section>
        <AiPanel hook={hook} onOpenLawSearch={() => setLawSearchOpen(true)} />
      </main>

      <footer className="border-t border-[#E1E1E1] bg-white shrink-0 px-4 py-2 text-xs text-[#999]">
        [BottomStatusBar placeholder]
      </footer>
      <LawSearchModal
        open={lawSearchOpen}
        onClose={() => setLawSearchOpen(false)}
        initialSuggestions={hook.state.lawSuggestions}
        onSave={(selected) => hook.update({ selectedLaws: selected })}
      />
      {(() => {
        const built = buildGenerateRequest(hook)
        if (!built) return null
        return (
          <ExportModal
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            intent={built.intent}
            form={built.form}
          />
        )
      })()}
    </div>
  )
}
