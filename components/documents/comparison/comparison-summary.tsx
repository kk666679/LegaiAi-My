"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export interface ComparisonStats { added: number; removed: number; modified: number; }
export function ComparisonSummary({ stats }: { stats: ComparisonStats }) {
  const rows = [
    { label: "Added", value: stats.added, tone: "text-emerald-600 dark:text-emerald-400" },
    { label: "Removed", value: stats.removed, tone: "text-destructive" },
    { label: "Modified", value: stats.modified, tone: "text-amber-600 dark:text-amber-400" },
  ];
  return (
    <Card className="flex items-center gap-4 p-3">
      {rows.map((r) => (
        <div key={r.label}><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.label}</p><p className={cn("text-lg font-semibold tabular-nums", r.tone)}>{r.value}</p></div>
      ))}
    </Card>
  );
}

import { cn } from "@/lib/utils";
