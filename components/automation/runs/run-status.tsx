// components/automation/runs/run-status.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkflowRun } from "../types";

const TONE: Record<WorkflowRun["status"], string> = {
  queued: "bg-muted text-muted-foreground",
  running: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function RunStatusBadge({ status }: { status: WorkflowRun["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent gap-1.5 text-[10px] font-medium capitalize", TONE[status])}
    >
      {status === "running" ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {status}
    </Badge>
  );
}
