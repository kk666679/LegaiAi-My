// components/hitl/analytics/hitl-stats-cards.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import type { HITLStats } from "../types";

export interface HITLStatsCardsProps {
  stats: HITLStats;
}

export function HITLStatsCards({ stats }: HITLStatsCardsProps) {
  const cells = [
    { label: "Total in queue", value: stats.total },
    { label: "Pending", value: stats.pending },
    { label: "In review", value: stats.inReview },
    { label: "Escalated", value: stats.escalated },
    {
      label: "SLA breached",
      value: stats.breachedSLAs,
      tone: stats.breachedSLAs > 0 ? "text-destructive" : undefined,
    },
    { label: "Approved today", value: stats.approvedToday },
    { label: "Rejected today", value: stats.rejectedToday },
    { label: "Avg decision", value: `${stats.avgDecisionMinutes.toFixed(1)}m` },
    { label: "Auto-approve rate", value: `${(stats.autoApprovalRate * 100).toFixed(0)}%` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {cells.map((c) => (
        <Card key={c.label} className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${c.tone ?? ""}`}>{c.value}</p>
        </Card>
      ))}
    </div>
  );
}