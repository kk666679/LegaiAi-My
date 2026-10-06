import { cn } from "@/lib/utils"
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type AlertType = "info" | "warning" | "success" | "error"

interface AIAlertProps {
  title?: string
  message: string
  type?: AlertType
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  className?: string
}

export function AIAlert({
  title,
  message,
  type = "info",
  dismissible = false,
  onDismiss,
  action,
  icon,
  className
}: AIAlertProps) {
  const getTypeConfig = () => {
    const config = {
      info: {
        icon: <Info className="h-5 w-5" />,
        bg: "bg-blue-50 border-blue-200",
        text: "text-blue-800",
        iconColor: "text-blue-500"
      },
      warning: {
        icon: <AlertTriangle className="h-5 w-5" />,
        bg: "bg-yellow-50 border-yellow-200",
        text: "text-yellow-800",
        iconColor: "text-yellow-500"
      },
      success: {
        icon: <CheckCircle2 className="h-5 w-5" />,
        bg: "bg-green-50 border-green-200",
        text: "text-green-800",
        iconColor: "text-green-500"
      },
      error: {
        icon: <XCircle className="h-5 w-5" />,
        bg: "bg-red-50 border-red-200",
        text: "text-red-800",
        iconColor: "text-red-500"
      }
    }
    return config[type]
  }

  const config = getTypeConfig()

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        config.bg,
        config.text,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className={cn("flex-shrink-0", config.iconColor)}>
          {icon || config.icon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className="text-sm mt-1">{message}</div>
          {action && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto -mt-2 -mr-2 flex-shrink-0"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}