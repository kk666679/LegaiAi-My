import { cn } from "@/lib/utils"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AILoadingStateProps {
  message?: string
  subMessage?: string
  type?: "spinner" | "pulse" | "dots"
  showRefresh?: boolean
  onRefresh?: () => void
  className?: string
}

export function AILoadingState({
  message = "Loading...",
  subMessage,
  type = "spinner",
  showRefresh = false,
  onRefresh,
  className
}: AILoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      {type === "spinner" && (
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      )}
      
      {type === "pulse" && (
        <div className="relative mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/20 animate-ping" />
          <div className="absolute inset-0 h-8 w-8 rounded-full bg-primary/40" />
        </div>
      )}

      {type === "dots" && (
        <div className="flex gap-1 mb-4">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.1s" }} />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
        </div>
      )}

      <h3 className="text-lg font-medium mb-2">{message}</h3>
      {subMessage && (
        <p className="text-sm text-muted-foreground mb-4">{subMessage}</p>
      )}

      {showRefresh && onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      )}
    </div>
  )
}