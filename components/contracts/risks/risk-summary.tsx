"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { ContractRisk } from "../types";

export function RiskSummary({ risks }: { risks: ContractRisk[] }) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of risks) counts[r.severity]++;
  const cells = [
    { label: "Critical", value: counts.critical, tone: "text-destructive" },
    { label: "High", value: counts.high, tone: "text-orange-600 dark:text-orange-400" },
    { label: "Medium", value: counts.medium, tone: "text-amber-600 dark:text-amber-400" },
    { label: "Low", value: counts.low, tone: "text-emerald-600 dark:text-emerald-400" },
  ];
  return (
    <Card className="flex items-center gap-6 p-4">
      {cells.map((c) => <div key={c.label}><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</p><p className={`text-2xl font-semibold tabular-nums ${c.tone}`}>{c.value}</p></div>)}
    </Card>
  );
}
