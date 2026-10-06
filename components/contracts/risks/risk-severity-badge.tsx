"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskSeverity } from "../types";

const TONE: Record<RiskSeverity, string> = {
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

export function RiskSeverityBadge({ severity }: { severity: RiskSeverity }) {
  return <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium capitalize", TONE[severity])}>{severity}</Badge>;
}
