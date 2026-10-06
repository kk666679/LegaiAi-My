"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContractStatus } from "../types";

const LABELS: Record<ContractStatus, string> = {
  draft: "Draft", "in-negotiation": "In negotiation", "pending-approval": "Pending approval",
  executed: "Executed", active: "Active", expiring: "Expiring", expired: "Expired",
  terminated: "Terminated", renewed: "Renewed", archived: "Archived",
};

const TONE: Record<ContractStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  "in-negotiation": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "pending-approval": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  executed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  expiring: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  expired: "bg-muted text-muted-foreground",
  terminated: "bg-destructive/10 text-destructive",
  renewed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "bg-muted text-muted-foreground",
};

export interface ContractStatusIndicatorProps { status: ContractStatus; compact?: boolean; className?: string; }

export function ContractStatusIndicator({ status, compact, className }: ContractStatusIndicatorProps) {
  return (
    <Badge variant="outline" className={cn("border-transparent gap-1.5 font-medium", TONE[status], compact && "px-1.5 py-0 text-[10px]", className)} aria-label={`Status: ${LABELS[status]}`}>
      {LABELS[status]}
    </Badge>
  );
}

export { LABELS as CONTRACT_STATUS_LABELS };
