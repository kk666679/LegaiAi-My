"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export interface ContractsKpisProps { total: number; active: number; totalValue: number; currency?: string; avgCycleDays: number; criticalRisks: number; overdueObligations: number; deviationRate: number; }
export function ContractsKpis({ total, active, totalValue, currency = "RM", avgCycleDays, criticalRisks, overdueObligations, deviationRate }: ContractsKpisProps) {
  const cells = [
    { label: "Total contracts", value: total.toLocaleString() },
    { label: "Active", value: active.toLocaleString() },
    { label: "Total value", value: `${currency} ${(totalValue / 1_000_000).toFixed(1)}M` },
    { label: "Avg cycle (days)", value: avgCycleDays.toFixed(1) },
    { label: "Critical risks", value: criticalRisks.toLocaleString() },
    { label: "Overdue obligations", value: overdueObligations.toLocaleString() },
    { label: "Deviation rate", value: `${(deviationRate * 100).toFixed(0)}%` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cells.map((c) => <Card key={c.label} className="p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p></Card>)}
    </div>
  );
}
