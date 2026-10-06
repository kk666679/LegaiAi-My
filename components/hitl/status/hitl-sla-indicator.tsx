// components/hitl/status/hitl-sla-indicator.tsx
"use client";

import * as React from "react";
import { Clock, TimerOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HITLSLADetail } from "../types";

export interface HITLSLAIndicatorProps {
  sla: HITLSLADetail;
  className?: string;
}

function formatRemaining(minutes?: number): string {
  if (minutes == null) return "";
  if (minutes <= 0) return "Overdue";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / (60 * 24))}d`;
}

export function HITLSLAIndicator({ sla, className }: HITLSLAIndicatorProps) {
  const totalMinutes = sla.hoursAllowed * 60;
  const used = sla.remainingMinutes != null ? totalMinutes - sla.remainingMinutes : 0;
  const pct = sla.breached ? 100 : totalMinutes ? Math.min(100, Math.max(0, (used / totalMinutes) * 100)) : 0;
  const nearBreach =
    !sla.breached && sla.remainingMinutes != null && sla.remainingMinutes < totalMinutes * 0.2;

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      aria-label={`SLA: ${sla.breached ? "breached" : `${formatRemaining(sla.remainingMinutes)} remaining`}`}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs",
          sla.breached
            ? "text-destructive"
            : nearBreach
            ? "text-orange-600 dark:text-orange-400"
            : "text-muted-foreground",
        )}
      >
        {sla.breached ? <TimerOff className="size-3.5" /> : <Clock className="size-3.5" />}
        <span className="tabular-nums">
          {sla.breached ? "SLA breached" : formatRemaining(sla.remainingMinutes)}
        </span>
      </span>
      <span
        className={cn(
          "h-1 w-12 overflow-hidden rounded-full",
          sla.breached ? "bg-destructive/20" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "block h-full",
            sla.breached ? "bg-destructive" : nearBreach ? "bg-orange-500" : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}