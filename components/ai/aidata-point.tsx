import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react"

interface AIDataPointProps {
  label: string
  value: string | number
  previousValue?: string | number
  change?: number
  unit?: string
  status?: "positive" | "negative" | "neutral" | "warning"
  size?: "sm" | "md" | "lg"
  showTrend?: boolean
  className?: string
}

export function AIDataPoint({
  label,
  value,
  previousValue,
  change,
  unit,
  status,
  size = "md",
  showTrend = true,
  className
}: AIDataPointProps) {
  const getStatusIcon = () => {
    if (status === "warning") return <AlertCircle className="h-4 w-4 text-yellow-500" />
    if (change === undefined) return null
    
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getStatusColor = () => {
    if (status === "warning") return "text-yellow-600"
    if (change === undefined) return "text-foreground"
    
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  const sizeClasses = {
    sm: {
      container: "gap-1",
      value: "text-lg",
      label: "text-xs",
      change: "text-xs"
    },
    md: {
      container: "gap-2",
      value: "text-2xl",
      label: "text-sm",
      change: "text-sm"
    },
    lg: {
      container: "gap-3",
      value: "text-3xl",
      label: "text-base",
      change: "text-base"
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={cn("flex flex-col", currentSize.container, className)}>
      <div className="flex items-center justify-between">
        <span className={cn("font-medium text-muted-foreground", currentSize.label)}>
          {label}
        </span>
        {showTrend && getStatusIcon()}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={cn("font-bold tracking-tight", currentSize.value)}>
          {value}
          {unit && <span className={cn("text-sm ml-1", currentSize.label)}>{unit}</span>}
        </span>
        
        {change !== undefined && (
          <span className={cn("font-medium", currentSize.change, getStatusColor())}>
            {change > 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      
      {previousValue !== undefined && (
        <div className={cn("text-muted-foreground", currentSize.label)}>
          Previous: {previousValue}{unit}
        </div>
      )}
    </div>
  )
}