"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ObligationStatus } from "../types";

const TONE: Record<ObligationStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  "in-progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  met: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  overdue: "bg-destructive/10 text-destructive",
  waived: "bg-muted text-muted-foreground",
  disputed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function ObligationStatusIndicator({ status }: { status: ObligationStatus }) {
  return <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium capitalize", TONE[status])}>{status.replace("-", " ")}</Badge>;
}
