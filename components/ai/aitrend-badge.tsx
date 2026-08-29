import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface AITrendBadgeProps {
  trend: number
  showIcon?: boolean
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AITrendBadge({
  trend,
  showIcon = true,
  showLabel = true,
  size = "md",
  className
}: AITrendBadgeProps) {
  const isPositive = trend > 0
  const isNegative = trend < 0
  const isNeutral = trend === 0

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base"
  }

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  const getIcon = () => {
    if (isPositive) return <TrendingUp className={iconSize[size]} />
    if (isNegative) return <TrendingDown className={iconSize[size]} />
    return <Minus className={iconSize[size]} />
  }

  const getColorClasses = () => {
    if (isPositive) return "bg-green-100 text-green-800 border-green-200"
    if (isNegative) return "bg-red-100 text-red-800 border-red-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        sizeClasses[size],
        getColorClasses(),
        className
      )}
    >
      {showIcon && getIcon()}
      {showLabel && (
        <span>
          {isPositive ? "+" : ""}{trend}%
        </span>
      )}
    </div>
  )
}