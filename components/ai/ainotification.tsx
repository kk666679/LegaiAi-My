import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info, Bell, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

type NotificationType = "info" | "success" | "warning" | "error"

interface AINotificationProps {
  title: string
  message: string
  type?: NotificationType
  duration?: number // in milliseconds, 0 for persistent
  onClose?: () => void
  onAction?: () => void
  actionLabel?: string
  showClose?: boolean
  timestamp?: Date
  className?: string
}

export function AINotification({
  title,
  message,
  type = "info",
  duration = 5000,
  onClose,
  onAction,
  actionLabel,
  showClose = true,
  timestamp,
  className
}: AINotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)
      
      return () => clearTimeout(timer)
    }
    return undefined
  }, [duration, onClose])

  if (!isVisible) return null

  const getTypeConfig = () => {
    const config = {
      info: {
        icon: <Info className="h-5 w-5" />,
        bg: "bg-blue-50 border-blue-200",
        text: "text-blue-800",
        iconColor: "text-blue-500"
      },
      success: {
        icon: <CheckCircle className="h-5 w-5" />,
        bg: "bg-green-50 border-green-200",
        text: "text-green-800",
        iconColor: "text-green-500"
      },
      warning: {
        icon: <AlertCircle className="h-5 w-5" />,
        bg: "bg-yellow-50 border-yellow-200",
        text: "text-yellow-800",
        iconColor: "text-yellow-500"
      },
      error: {
        icon: <AlertCircle className="h-5 w-5" />,
        bg: "bg-red-50 border-red-200",
        text: "text-red-800",
        iconColor: "text-red-500"
      }
    }
    return config[type]
  }

  const config = getTypeConfig()

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border p-4 shadow-lg animate-in slide-in-from-right",
        config.bg,
        config.text,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
          {config.icon}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <div className="mt-1 text-sm opacity-90">{message}</div>
              
              {timestamp && (
                <div className="mt-2 flex items-center gap-1 text-xs opacity-75">
                  <Clock className="h-3 w-3" />
                  {getTimeAgo(timestamp)}
                </div>
              )}
            </div>
            
            {showClose && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 -mt-1 -mr-2 h-6 w-6 p-0 opacity-70 hover:opacity-100"
                onClick={handleClose}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {(onAction && actionLabel) && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onAction}
                className="text-xs"
              >
                {actionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 animate-progress">
          <style jsx>{`
            @keyframes progress {
              from { width: 100%; }
              to { width: 0%; }
            }
            .animate-progress {
              animation: progress ${duration}ms linear forwards;
            }
          `}</style>
        </div>
      )}
    </div>
  )
}

// Notification Container Component
interface AINotificationContainerProps {
  notifications: Array<AINotificationProps & { id: string }>
  onNotificationClose?: (id: string) => void
  maxNotifications?: number
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  className?: string
}

export function AINotificationContainer({
  notifications,
  onNotificationClose,
  maxNotifications = 5,
  position = "top-right",
  className
}: AINotificationContainerProps) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4"
  }

  const displayNotifications = notifications.slice(0, maxNotifications)

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-3 max-w-sm",
        positionClasses[position],
        className
      )}
    >
      {displayNotifications.map((notification) => (
        <AINotification
          key={notification.id}
          {...notification}
          onClose={() => onNotificationClose?.(notification.id)}
        />
      ))}
    </div>
  )
}