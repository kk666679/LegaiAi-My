import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface AIChipProps {
  label: string
  onRemove?: () => void
  removable?: boolean
  variant?: "default" | "outline" | "secondary" | "success" | "warning" | "error"
  size?: "sm" | "md" | "lg"
  icon?: React.ReactNode
  className?: string
}

export function AIChip({
  label,
  onRemove,
  removable = false,
  variant = "default",
  size = "md",
  icon,
  className
}: AIChipProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-input bg-background",
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    error: "bg-red-100 text-red-800 border border-red-200"
  }

  const sizeClasses = {
    sm: "h-6 px-2 text-xs",
    md: "h-8 px-3 text-sm",
    lg: "h-10 px-4 text-base"
  }

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {icon}
      {label}
      {removable && (
        <button
          onClick={onRemove}
          className={cn(
            "ml-1 rounded-full p-0.5 hover:bg-black/10",
            variant === "default" && "hover:bg-white/20"
          )}
        >
          <X className={iconSize[size]} />
        </button>
      )}
    </div>
  )
}