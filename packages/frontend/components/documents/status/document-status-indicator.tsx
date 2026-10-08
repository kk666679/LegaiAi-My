// components/documents/status/document-status-indicator.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "../types";

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  analysing: "Analysing",
  analysed: "Analysed",
  review: "In Review",
  "changes-requested": "Changes Requested",
  approved: "Approved",
  final: "Final",
  archived: "Archived",
  error: "Error",
};

const STATUS_TONE: Record<DocumentStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  uploading: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ready: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  analysing: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  analysed: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "changes-requested": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  final: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive",
};

export interface DocumentStatusIndicatorProps {
  status: DocumentStatus;
  className?: string;
  compact?: boolean;
}

export function DocumentStatusIndicator({
  status,
  className,
  compact,
}: DocumentStatusIndicatorProps) {
  const isLive = status === "uploading" || status === "processing" || status === "analysing";
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent gap-1.5 font-medium",
        STATUS_TONE[status],
        compact && "px-1.5 py-0 text-[10px]",
        className,
      )}
      aria-label={`Status: ${STATUS_LABELS[status]}`}
    >
      {isLive ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export { STATUS_LABELS };
