import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Target, TrendingUp, Timer, CheckCircle2 } from "lucide-react"

interface Milestone {
  label: string
  progress: number
  status: "completed" | "in-progress" | "pending"
}

interface AIProgressCardProps {
  title: string
  description?: string

  /**
   * Backwards-compatible with older callers.
   * If provided, we derive current/target from it.
   */
  progress?: number

  currentProgress?: number
  targetProgress?: number

  milestones?: Milestone[]
  estimatedCompletion?: string
  icon?: React.ReactNode
  className?: string
}


export function AIProgressCard({
  title,
  description,
  progress,
  currentProgress,
  targetProgress,
  milestones,
  estimatedCompletion,
  icon = <Target className="h-5 w-5" />,
  className
}: AIProgressCardProps) {
  const resolvedCurrent = currentProgress ?? progress ?? 0
  const resolvedTarget = targetProgress ?? 100

  const progressPercentage = (resolvedCurrent / resolvedTarget) * 100
  const isComplete = resolvedCurrent >= resolvedTarget


  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{currentProgress}/{targetProgress}</div>
            <div className="text-sm text-muted-foreground">
              {isComplete ? "Complete" : "In Progress"}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {milestones && milestones.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Milestones</h4>
            {milestones.map((milestone, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {milestone.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : milestone.status === "in-progress" ? (
                      <Timer className="h-4 w-4 text-blue-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300" />
                    )}
                    <span>{milestone.label}</span>
                  </div>
                  <span className="font-medium">{milestone.progress}%</span>
                </div>
                <Progress value={milestone.progress} className="h-1" />
              </div>
            ))}
          </div>
        )}

        {estimatedCompletion && !isComplete && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>Estimated completion: {estimatedCompletion}</span>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>All targets achieved!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}