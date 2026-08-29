import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Lightbulb, AlertTriangle, Info, CheckCircle2 } from "lucide-react"

type InsightType = "info" | "warning" | "success" | "critical"

interface AIInsightCardProps {
  title: string
  insight: string
  type?: InsightType
  recommendation?: string
  tags?: string[]
  className?: string
}

export function AIInsightCard({
  title,
  insight,
  type = "info",
  recommendation,
  tags,
  className
}: AIInsightCardProps) {
  const getIcon = () => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getTypeStyles = () => {
    switch (type) {
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "success":
        return "border-green-200 bg-green-50"
      case "critical":
        return "border-red-200 bg-red-50"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  return (
    <Card className={cn("relative", getTypeStyles(), className)}>
      <CardHeader className="flex flex-row items-start space-x-4 space-y-0">
        <div className="mt-1">{getIcon()}</div>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {title}
          </CardTitle>
          <CardDescription className="text-sm">{insight}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {recommendation && (
          <div className="mt-4 p-3 bg-white/50 rounded-lg border">
            <p className="text-sm font-medium mb-1">Recommendation:</p>
            <p className="text-sm">{recommendation}</p>
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs rounded-full bg-white/70 border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}