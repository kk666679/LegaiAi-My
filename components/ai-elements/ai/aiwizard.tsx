import { cn } from "@/lib/utils"
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WizardStep {
  id: string
  title: string
  description?: string
  component: React.ReactNode
}

interface AIWizardProps {
  steps: WizardStep[]
  currentStep: number
  onStepChange: (step: number) => void
  onComplete?: () => void
  className?: string
}

export function AIWizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  className
}: AIWizardProps) {
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.()
    } else {
      onStepChange(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1)
    }
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Steps Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-full border-2",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary",
                    !isCompleted && !isCurrent && "border-muted-foreground/30"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className={cn(
                      "font-medium",
                      isCurrent && "text-primary"
                    )}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "mt-2 text-xs font-medium",
                  isCurrent && "text-primary",
                  !isCurrent && !isCompleted && "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-16 mx-4",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Current Step Content */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">
            {steps[currentStep]?.title}
          </h2>
          {steps[currentStep]?.description && (
            <p className="text-muted-foreground mt-2">
              {steps[currentStep]?.description}
            </p>
          )}
        </div>

        <div className="min-h-[300px]">
          {steps[currentStep]?.component}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={isFirstStep}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          className="gap-2"
        >
          {isLastStep ? "Complete" : "Next"}
          {!isLastStep && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}