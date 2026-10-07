"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, RefreshCw } from "lucide-react";

export interface AIErrorStateProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
}

export function AIErrorState({
  error,
  onRetry,
  onDismiss,
  className,
  showDetails = false,
}: AIErrorStateProps) {
  const message = error instanceof Error ? error.message : error;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="size-5 text-destructive" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-destructive">Error</p>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
          {showDetails && error instanceof Error && error.stack && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer">Show details</summary>
              <pre className="mt-2 text-[10px] overflow-auto rounded bg-background p-2 max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {onRetry && (
            <Button
              variant="default"
              size="sm"
              className="w-full gap-1.5"
              onClick={onRetry}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5"
              onClick={onDismiss}
            >
              <X className="size-3.5" aria-hidden />
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}