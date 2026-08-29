import { cn } from "@/lib/utils"

interface AIBadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "error" | "info"
  size?: "sm" | "md" | "lg"
  rounded?: "full" | "lg" | "md" | "sm"
  icon?: React.ReactNode
  className?: string
}

export function AIBadge({
  children,
  variant = "default",
  size = "md",
  rounded = "full",
  icon,
  className
}: AIBadgeProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background",
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    error: "bg-red-100 text-red-800 border border-red-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200"
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base"
  }

  const roundedClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses[rounded],
        className
      )}
    >
      {icon}
      {children}
    </div>
  )
}