import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, AlertCircle, Clock, PauseCircle, PlayCircle } from "lucide-react"

type StatusType = 
  | "online" 
  | "offline" 
  | "idle" 
  | "busy" 
  | "error" 
  | "warning" 
  | "success" 
  | "pending" 
  | "paused" 
  | "syncing"

interface AIStatusIndicatorProps {
  status: StatusType
  label?: string
  size?: "sm" | "md" | "lg"
  showPulse?: boolean
  showLabel?: boolean
  className?: string
}

export function AIStatusIndicator({
  status,
  label,
  size = "md",
  showPulse = true,
  showLabel = true,
  className
}: AIStatusIndicatorProps) {
  const getStatusConfig = () => {
    const config = {
      online: {
        color: "bg-green-500",
        border: "border-green-200",
        text: "text-green-700",
        icon: <div className="h-2 w-2 rounded-full bg-white" />,
        label: "Online"
      },
      offline: {
        color: "bg-gray-400",
        border: "border-gray-200",
        text: "text-gray-700",
        icon: <div className="h-2 w-2 rounded-full bg-white" />,
        label: "Offline"
      },
      idle: {
        color: "bg-yellow-500",
        border: "border-yellow-200",
        text: "text-yellow-700",
        icon: <div className="h-2 w-2 rounded-full bg-white" />,
        label: "Idle"
      },
      busy: {
        color: "bg-orange-500",
        border: "border-orange-200",
        text: "text-orange-700",
        icon: <div className="h-2 w-2 rounded-full bg-white" />,
        label: "Busy"
      },
      error: {
        color: "bg-red-500",
        border: "border-red-200",
        text: "text-red-700",
        icon: <XCircle className="h-4 w-4" />,
        label: "Error"
      },
      warning: {
        color: "bg-yellow-500",
        border: "border-yellow-200",
        text: "text-yellow-700",
        icon: <AlertCircle className="h-4 w-4" />,
        label: "Warning"
      },
      success: {
        color: "bg-green-500",
        border: "border-green-200",
        text: "text-green-700",
        icon: <CheckCircle className="h-4 w-4" />,
        label: "Success"
      },
      pending: {
        color: "bg-blue-500",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: <Clock className="h-4 w-4" />,
        label: "Pending"
      },
      paused: {
        color: "bg-gray-500",
        border: "border-gray-200",
        text: "text-gray-700",
        icon: <PauseCircle className="h-4 w-4" />,
        label: "Paused"
      },
      syncing: {
        color: "bg-blue-500",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: <PlayCircle className="h-4 w-4" />,
        label: "Syncing"
      }
    }
    return config[status]
  }

  const sizeConfig = {
    sm: {
      container: "h-5 px-2 text-xs",
      icon: "h-2 w-2",
      pulse: "h-3 w-3"
    },
    md: {
      container: "h-7 px-3 text-sm",
      icon: "h-3 w-3",
      pulse: "h-4 w-4"
    },
    lg: {
      container: "h-9 px-4 text-base",
      icon: "h-4 w-4",
      pulse: "h-5 w-5"
    }
  }

  const config = getStatusConfig()
  const sizeStyles = sizeConfig[size]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium",
        config.border,
        config.text,
        sizeStyles.container,
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={cn(
            "flex items-center justify-center rounded-full",
            config.color,
            sizeStyles.icon,
            status === "online" && showPulse && "animate-pulse"
          )}
        >
          {config.icon}
        </div>
        
        {showPulse && (status === "online" || status === "syncing") && (
          <div
            className={cn(
              "absolute rounded-full animate-ping",
              config.color,
              sizeStyles.pulse
            )}
          />
        )}
      </div>
      
      {showLabel && (
        <span>
          {label || config.label}
        </span>
      )}
    </div>
  )
}