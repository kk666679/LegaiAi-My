"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { ContractStats } from "../types";

export function ContractsStats({ stats }: { stats: ContractStats }) {
  const cells = [
    { label: "Total", value: stats.total.toLocaleString() },
    { label: "Active", value: stats.active.toLocaleString() },
    { label: "In negotiation", value: stats.inNegotiation.toLocaleString() },
    { label: "Pending approval", value: stats.pendingApproval.toLocaleString() },
    { label: "Expiring soon", value: stats.expiring.toLocaleString() },
    { label: "Overdue obligations", value: stats.overdueObligations.toLocaleString() },
    { label: "Critical risks", value: stats.criticalRisks.toLocaleString() },
    { label: "Total value", value: `${stats.currency ?? "RM"} ${(stats.totalValue / 1_000_000).toFixed(1)}M` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4">
      {cells.map((c) => (
        <Card key={c.label} className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
        </Card>
      ))}
    </div>
  );
}
