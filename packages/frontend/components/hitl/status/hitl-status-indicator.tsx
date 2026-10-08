// components/hitl/status/hitl-status-indicator.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HITLStatus } from "../types";

const LABELS: Record<HITLStatus, string> = {
  pending: "Pending",
  "in-review": "In review",
  escalated: "Escalated",
  "changes-requested": "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
  executed: "Executed",
  deferred: "Deferred",
  expired: "Expired",
  cancelled: "Cancelled",
};

const TONE: Record<HITLStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "in-review": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  escalated: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "changes-requested": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  executed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  deferred: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export interface HITLStatusIndicatorProps {
  status: HITLStatus;
  compact?: boolean;
  className?: string;
}

export function HITLStatusIndicator({ status, compact, className }: HITLStatusIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent gap-1.5 font-medium",
        TONE[status],
        compact && "px-1.5 py-0 text-[10px]",
        className,
      )}
      aria-label={`Status: ${LABELS[status]}`}
    >
      {status === "in-review" ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {LABELS[status]}
    </Badge>
  );
}

export { LABELS as HITL_STATUS_LABELS };