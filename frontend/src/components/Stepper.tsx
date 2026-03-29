import { Check } from "lucide-react"

interface StepperProps {
  currentStep: number
  steps: { label: string; icon: string }[]
}

export default function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden lg:flex flex-col gap-1">
        {steps.map((step, i) => {
          const stepNum = i + 1
          const isActive = stepNum === currentStep
          const isCompleted = stepNum < currentStep

          return (
            <div key={stepNum} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                    ${isCompleted
                      ? "bg-[#1B2D6B] text-white"
                      : isActive
                        ? "bg-[#F5922A] text-white"
                        : "bg-[#E1E1E1] text-[#999]"
                    }
                  `}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 h-6 my-0.5 rounded-full ${stepNum < currentStep ? "bg-[#1B2D6B]" : "bg-[#E1E1E1]"}`} />
                )}
              </div>
              <span
                className={`text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-[#F5922A] font-semibold"
                    : isCompleted
                      ? "text-[#1B2D6B] font-medium"
                      : "text-[#999]"
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </nav>

      {/* Mobile: horizontal */}
      <nav className="flex lg:hidden items-center justify-center gap-0 w-full px-2">
        {steps.map((step, i) => {
          const stepNum = i + 1
          const isActive = stepNum === currentStep
          const isCompleted = stepNum < currentStep

          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                    ${isCompleted
                      ? "bg-[#1B2D6B] text-white"
                      : isActive
                        ? "bg-[#F5922A] text-white"
                        : "bg-[#E1E1E1] text-[#999]"
                    }
                  `}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.icon}
                </div>
                <span
                  className={`text-[10px] whitespace-nowrap transition-colors ${
                    isActive ? "text-[#F5922A] font-medium" : isCompleted ? "text-[#1B2D6B]" : "text-[#999]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mt-[-1rem] rounded-full ${stepNum < currentStep ? "bg-[#1B2D6B]" : "bg-[#E1E1E1]"}`} />
              )}
            </div>
          )
        })}
      </nav>
    </>
  )
}
