// components/documents/status/document-error.tsx
"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DocumentErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function DocumentError({
  title = "Something went wrong",
  description = "We couldn't load your documents. Please try again.",
  onRetry,
  className,
}: DocumentErrorProps) {
  return (
    <Alert variant="destructive" className={cn("flex items-start gap-3", className)}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex-1 space-y-2">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
