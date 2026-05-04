import { useState } from "react"
import { useDirectDocState } from "./useDirectDocState"
import DocCanvas from "./DocCanvas"
import OnboardingOverlay from "./OnboardingOverlay"
import AiPanel from "./AiPanel"
import LawSearchModal from "./LawSearchModal"
import Header from "./Header"
import ExportModal from "./ExportModal"
import BottomStatusBar from "./BottomStatusBar"
import { toGenerateRequest } from "./payload"

export default function DirectEditPage() {
  const hook = useDirectDocState()
  const { state, organTree } = hook
  const [lawSearchOpen, setLawSearchOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F5F1EC] relative">
      <Header canUndo={hook.canUndo} onUndo={hook.undo} onRestart={hook.reset} onExport={() => setExportOpen(true)} />

      {(state.phase === "onboarding" || state.phase === "parsing") && (
        <OnboardingOverlay
          onSubmit={hook.onSubmitOnboarding}
          onBlank={() => hook.setPhase("ready")}
          loading={state.phase === "parsing"}
          organTree={organTree}
        />
      )}

      <main className="relative flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">
        <section className="overflow-y-auto p-6 lg:p-10">
          <DocCanvas hook={hook} organTree={organTree} />
        </section>
        <AiPanel hook={hook} onOpenLawSearch={() => setLawSearchOpen(true)} />
      </main>

      <BottomStatusBar hook={hook} />
      <LawSearchModal
        open={lawSearchOpen}
        onClose={() => setLawSearchOpen(false)}
        initialSuggestions={hook.state.lawSuggestions}
        onSave={(selected) => hook.update({ selectedLaws: selected })}
      />
      {(() => {
        const built = toGenerateRequest(hook.state, hook.mergedIntent)
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
