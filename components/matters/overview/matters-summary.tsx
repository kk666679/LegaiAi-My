// components/matters/overview/matters-summary.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import type { MatterStats } from "../types";

export interface MattersSummaryProps {
  stats: MatterStats;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

export function MattersSummary({ stats }: MattersSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Stat label="Total" value={stats.total} />
      <Stat label="Open" value={stats.open} />
      <Stat label="On hold" value={stats.onHold} />
      <Stat label="Deadlines (7d)" value={stats.deadlinesThisWeek} />
      <Stat label="Unbilled hours" value={stats.unbilledHours.toFixed(1)} />
      <Stat
        label="Outstanding"
        value={`RM ${stats.outstandingBalance.toLocaleString()}`}
      />
    </div>
  );
}
