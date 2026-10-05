import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { motion } from "framer-motion"
import { isValidElement, type ReactElement, type ComponentType } from "react"

interface AIMetricCardProps {
  title?: string
  label?: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
  } | string
  change?: string
  gradient?: string
  accent?: string
  icon?: React.ReactNode | ComponentType<{ className?: string }>
  className?: string
  onClick?: () => void
  animation?: "scale" | "fade" | "pulse"
  delay?: number
  showProgress?: boolean
  progressValue?: number
}

// Helper function to render icon - handles both React elements and component classes
function renderIcon(icon: React.ReactNode | ComponentType<{ className?: string }>, defaultClassName: string = "h-4 w-4") {
  if (!icon) return null

  if (isValidElement(icon)) {
    // Already a React element, return as-is
    return icon
  }

  // It's a component class, instantiate it
  const IconComponent = icon as ComponentType<{ className?: string }>
  return <IconComponent className={defaultClassName} />
}

export function AIMetricCard({
  title,
  label,
  value,
  description,
  trend,
  icon,
  accent,
  className,
}: AIMetricCardProps) {
  const cardLabel = title ?? label ?? "Metric"
  const trendMeta = typeof trend === "string"
    ? { value: Number.parseFloat(trend.replace(/[^0-9.-]/g, "")), label: "" }
    : trend
  const getTrendIcon = () => {
    if (!trendMeta) return null
    if (trendMeta.value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trendMeta.value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  return (
    <Card className={cn("relative overflow-hidden", accent, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{cardLabel}</CardTitle>
        {renderIcon(icon, "h-4 w-4")}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trendMeta && (
          <div className="flex items-center gap-1 mt-2">
            {getTrendIcon()}
            <span className={cn(
              "text-xs font-medium",
              trendMeta.value > 0 ? "text-green-500" :
              trendMeta.value < 0 ? "text-red-500" : "text-gray-500"
            )}>
              {trendMeta.value > 0 ? "+" : ""}{trendMeta.value}% {trendMeta.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}