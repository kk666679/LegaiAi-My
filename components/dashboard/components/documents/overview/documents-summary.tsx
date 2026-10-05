// components/documents/overview/documents-summary.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import type { DocumentsStats } from "../types";

export interface DocumentsSummaryProps {
  stats: DocumentsStats;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

export function DocumentsSummary({ stats }: DocumentsSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Stat label="Total" value={stats.total} />
      <Stat label="Ready" value={stats.ready} />
      <Stat label="Processing" value={stats.processing} />
      <Stat label="In Review" value={stats.review} />
      <Stat label="Approvals" value={stats.pendingApproval} />
      <Stat label="Analysed" value={stats.analysed} />
    </div>
  );
}
