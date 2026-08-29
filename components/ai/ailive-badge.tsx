import { cn } from "@/lib/utils"

interface AILiveBadgeProps {
  status: "live" | "paused" | "error" | "syncing" | "active" | "analyzing"
  pulse?: boolean
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function AILiveBadge({
  status,
  pulse = true,
  size = "md",
  showLabel = true,
  className
}: AILiveBadgeProps) {
  const statusConfig = {
    live: {
      label: "Live",
      color: "bg-green-500",
      text: "text-green-700",
      bg: "bg-green-100",
      border: "border-green-200"
    },
    paused: {
      label: "Paused",
      color: "bg-yellow-500",
      text: "text-yellow-700",
      bg: "bg-yellow-100",
      border: "border-yellow-200"
    },
    error: {
      label: "Error",
      color: "bg-red-500",
      text: "text-red-700",
      bg: "bg-red-100",
      border: "border-red-200"
    },
    syncing: {
      label: "Syncing",
      color: "bg-blue-500",
      text: "text-blue-700",
      bg: "bg-blue-100",
      border: "border-blue-200"
    },
    active: {
      label: "Active",
      color: "bg-green-500",
      text: "text-green-700",
      bg: "bg-green-100",
      border: "border-green-200"
    },
    analyzing: {
      label: "Analyzing",
      color: "bg-purple-500",
      text: "text-purple-700",
      bg: "bg-purple-100",
      border: "border-purple-200"
    }
  }

  const sizeConfig = {
    sm: {
      container: "px-2 py-0.5 gap-1.5",
      dot: "h-1.5 w-1.5",
      text: "text-xs"
    },
    md: {
      container: "px-2.5 py-1 gap-2",
      dot: "h-2 w-2",
      text: "text-sm"
    },
    lg: {
      container: "px-3 py-1.5 gap-2",
      dot: "h-2.5 w-2.5",
      text: "text-base"
    }
  }

  const config = statusConfig[status] || statusConfig.live
  const sizeStyles = sizeConfig[size] || sizeConfig.md

  if (!config) return null

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        config.bg,
        config.border,
        sizeStyles.container,
        className
      )}
    >
      <div className="relative flex items-center">
        <div
          className={cn(
            "rounded-full",
            config.color,
            sizeStyles.dot,
            pulse && ["live", "active", "analyzing", "syncing"].includes(status) && "animate-pulse"
          )}
        />
        {pulse && ["live", "active"].includes(status) && (
          <div
            className={cn(
              "absolute rounded-full animate-ping",
              config.color,
              sizeStyles.dot
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className={cn("font-medium", config.text, sizeStyles.text)}>
          {config.label}
        </span>
      )}
    </div>
  )
}
