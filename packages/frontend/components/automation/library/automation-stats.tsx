"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export interface AutomationStats { total: number; active: number; draft: number; runs24h: number; successRate: number; }
export function AutomationStatsBar({ stats }: { stats: AutomationStats }) {
  const cells = [
    { label: "Total", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Draft", value: stats.draft },
    { label: "Runs (24h)", value: stats.runs24h },
    { label: "Success", value: `${stats.successRate.toFixed(0)}%` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cells.map((c) => (
        <Card key={c.label} className="p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{c.value}</p>
        </Card>
      ))}
    </div>
  );
}
