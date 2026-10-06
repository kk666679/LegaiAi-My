"use client";
import * as React from "react";
import { KpiCard } from "@/components/matters/charts";
import { Activity, Clock, CheckCircle2, TrendingUp } from "lucide-react";

export function WorkflowAnalyticsPage({ id }: { id: string }) {
  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total runs" value="0" icon={<Activity className="size-4" />} />
        <KpiCard label="Success rate" value="—" icon={<CheckCircle2 className="size-4" />} color="hsl(160 84% 39%)" />
        <KpiCard label="Avg duration" value="—" icon={<Clock className="size-4" />} color="hsl(32 95% 44%)" />
        <KpiCard label="Runs (7d)" value="0" icon={<TrendingUp className="size-4" />} color="hsl(262 83% 58%)" />
      </div>
      <p className="text-xs text-muted-foreground">Wire these to real metrics: GET /api/automations/{id}/metrics</p>
    </div>
  );
}
