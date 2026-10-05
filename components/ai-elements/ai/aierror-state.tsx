import { cn } from "@/lib/utils"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AIErrorStateProps {
  title?: string
  /** Human-readable error message */
  message?: string
  /** Backwards-compatible: some callers pass `error` instead of `message`. */
  error?: string
  errorCode?: string
  showRetry?: boolean
  showHome?: boolean
  onRetry?: () => void
  onHome?: () => void
  className?: string
}


export function AIErrorState({
  title = "Something went wrong",
  message,
  error,
  errorCode,

  showRetry = true,
  showHome = false,
  onRetry,
  onHome,
  className
}: AIErrorStateProps) {
  const resolvedMessage = message ?? error ?? "Something went wrong"

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="relative mb-6">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <div className="absolute -inset-4 bg-destructive/10 rounded-full blur-xl" />
      </div>

      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{resolvedMessage}</p>


      {errorCode && (
        <div className="mb-6 px-3 py-2 bg-muted rounded-md font-mono text-sm">
          Error: {errorCode}
        </div>
      )}

      <div className="flex gap-3">
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}

        {showHome && onHome && (
          <Button
            variant="outline"
            onClick={onHome}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        )}
      </div>
    </div>
  )
}