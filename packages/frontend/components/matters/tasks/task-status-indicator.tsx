// components/matters/tasks/task-status-indicator.tsx
"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatterTaskStatus } from "../types";

const LABELS: Record<MatterTaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  blocked: "Blocked",
  review: "Review",
  done: "Done",
  cancelled: "Cancelled",
};

const TONE: Record<MatterTaskStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  "in-progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  blocked: "bg-destructive/10 text-destructive",
  review: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  done: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-muted text-muted-foreground",
};

export function TaskStatusIndicator({ status, className }: { status: MatterTaskStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("border-transparent gap-1 text-[10px] font-medium", TONE[status], className)}>
      {LABELS[status]}
    </Badge>
  );
}
