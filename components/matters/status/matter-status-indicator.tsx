// components/matters/status/matter-status-indicator.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatterStatus } from "../types";

const LABELS: Record<MatterStatus, string> = {
  intake: "Intake",
  open: "Open",
  "on-hold": "On Hold",
  pending: "Pending",
  review: "Review",
  billing: "Billing",
  closed: "Closed",
  archived: "Archived",
  cancelled: "Cancelled",
};

const TONE: Record<MatterStatus, string> = {
  intake: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  open: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "on-hold": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  review: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  billing: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  closed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

export interface MatterStatusIndicatorProps {
  status: MatterStatus;
  compact?: boolean;
  className?: string;
}

export function MatterStatusIndicator({ status, compact, className }: MatterStatusIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent gap-1.5 font-medium", TONE[status], compact && "px-1.5 py-0 text-[10px]", className)}
      aria-label={`Status: ${LABELS[status]}`}
    >
      {LABELS[status]}
    </Badge>
  );
}

export { LABELS as MATTER_STATUS_LABELS };
