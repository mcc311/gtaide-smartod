import { useEffect, useState } from "react"
import { useDirectDocState } from "./useDirectDocState"
import DocCanvas from "./DocCanvas"
import OnboardingOverlay from "./OnboardingOverlay"
import type { OrganNode } from "@/types"

export default function DirectEditPage() {
  const hook = useDirectDocState()
  const { state } = hook
  const [organTree, setOrganTree] = useState<OrganNode[]>([])
  useEffect(() => {
    fetch("/api/organs")
      .then((r) => r.json())
      .then((data: OrganNode[]) => setOrganTree(data))
      .catch(() => {})
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F5F1EC] relative">
      <header className="border-b border-[#E1E1E1] bg-white shrink-0 px-4 lg:px-8 py-3">
        <div className="flex items-center gap-2.5">
          <img src="/gtaide_logo.svg" alt="GTAIDE" className="h-7" />
          <div className="hidden sm:block h-5 w-px bg-[#E1E1E1]" />
          <span className="hidden sm:inline text-base font-semibold text-[#1B2D6B]">
            SmartOD <span className="text-[#666] font-normal">· 直接編輯版</span>
          </span>
        </div>
      </header>

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
        <aside className="hidden lg:block border-l border-[#E1E1E1] bg-white overflow-y-auto p-4">
          <p className="text-sm text-[#999]">[AiPanel placeholder]</p>
        </aside>
      </main>

      <footer className="border-t border-[#E1E1E1] bg-white shrink-0 px-4 py-2 text-xs text-[#999]">
        [BottomStatusBar placeholder]
      </footer>
    </div>
  )
}
