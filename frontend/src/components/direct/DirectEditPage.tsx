import { useEffect, useState } from "react"
import { useDirectDocState } from "./useDirectDocState"
import DocCanvas from "./DocCanvas"
import OnboardingOverlay from "./OnboardingOverlay"
import AiPanel from "./AiPanel"
import LawSearchModal from "./LawSearchModal"
import Header from "./Header"
import type { OrganNode } from "@/types"

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
      {exportOpen && null /* placeholder until Task 18 */}
    </div>
  )
}
