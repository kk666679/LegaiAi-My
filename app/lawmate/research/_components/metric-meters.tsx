"use client";
// app/lawmate/research/_components/metric-meters.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function ConfidenceMeter({
  value,
  label = "Confidence",
  compact,
  className,
}: {
  value: number;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tone =
    pct >= 85 ? "bg-emerald-500" :
    pct >= 65 ? "bg-blue-500" :
    pct >= 40 ? "bg-amber-500" : "bg-destructive";

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground", className)}
        aria-label={`${label}: ${pct}%`}
      >
        <span className="h-1 w-8 overflow-hidden rounded-full bg-muted">
          <span className={cn("block h-full", tone)} style={{ width: `${pct}%` }} />
        </span>
        {pct}%
      </span>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function RelevanceMeter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground", className)}
      aria-label={`Relevance: ${pct}%`}
    >
      <span className="h-1 w-12 overflow-hidden rounded-full bg-muted">
        <span
          className={cn("block h-full", pct >= 80 ? "bg-emerald-500" : pct >= 55 ? "bg-blue-500" : "bg-muted-foreground/50")}
          style={{ width: `${pct}%` }}
        />
      </span>
      {pct}%
    </span>
  );
}
