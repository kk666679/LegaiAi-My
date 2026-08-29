import { cn } from "@/lib/utils"

interface AIStatisticProps {
  label: string
  value: string | number
  subValue?: string | number
  icon?: React.ReactNode
  trend?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AIStatistic({
  label,
  value,
  subValue,
  icon,
  trend,
  size = "md",
  className
}: AIStatisticProps) {
  const sizeClasses = {
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3"
  }

  const valueSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl"
  }

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <div className={cn("flex flex-col", sizeClasses[size], className)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-muted-foreground font-medium", labelSizeClasses[size])}>
          {label}
        </span>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <span className={cn("font-bold tracking-tight", valueSizeClasses[size])}>
          {value}
        </span>
        {subValue && (
          <span className="text-sm text-muted-foreground mb-0.5">
            {subValue}
          </span>
        )}
        {trend !== undefined && (
          <span className={cn(
            "text-sm font-medium mb-0.5",
            trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500"
          )}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
    </div>
  )
}