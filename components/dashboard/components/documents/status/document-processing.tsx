// components/documents/status/document-processing.tsx
"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ProcessingStage =
  | "uploading"
  | "processing"
  | "extracting"
  | "analysing"
  | "ready"
  | "failed";

const STAGE_LABEL: Record<ProcessingStage, string> = {
  uploading: "Uploading document",
  processing: "Processing document",
  extracting: "Extracting text",
  analysing: "Preparing AI analysis",
  ready: "Ready",
  failed: "Failed",
};

export interface DocumentProcessingProps {
  fileName: string;
  stage: ProcessingStage;
  progress?: number;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export function DocumentProcessing({
  fileName,
  stage,
  progress,
  errorMessage,
  onRetry,
  className,
}: DocumentProcessingProps) {
  const showBar = stage !== "ready" && stage !== "failed";
  return (
    <div
      className={cn("rounded-lg border border-border/60 bg-card p-4", className)}
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{fileName}</p>
        {stage === "failed" && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-medium text-primary hover:underline"
          >
            Retry
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{STAGE_LABEL[stage]}</p>
      {showBar ? (
        <Progress
          value={typeof progress === "number" ? progress : undefined}
          className="mt-3 h-1.5"
        />
      ) : null}
      {stage === "failed" && errorMessage ? (
        <p className="mt-2 text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
