"use client";
// app/legalai/research/_components/research-analytics.tsx
import * as React from "react";
import { KpiCard } from "@/components/charts/kpi/kpi-card";
import { ChartCard } from "@/components/charts/primitives/chart-card";
import { DonutChart } from "@/components/charts/primitives/donut-chart";
import { HorizontalBarChart } from "@/components/charts/primitives/horizontal-bar-chart";
import { LineChart } from "@/components/charts/primitives/line-chart";
import { useResearch } from "./use-research";
import { AUTHORITY_KIND_LABELS } from "./types";

export function ResearchAnalyticsPage() {
  const { stats } = useResearch({});

  const byKind = React.useMemo(
    () =>
      stats
        ? Object.entries(stats.byKind)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => ({ label: AUTHORITY_KIND_LABELS[k as keyof typeof AUTHORITY_KIND_LABELS], value: v }))
        : [],
    [stats],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Research analytics</h1>
        <p className="text-xs text-muted-foreground">
          Usage, confidence, and source coverage across your workspace.
        </p>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Sessions"
            value={stats?.totalSessions ?? 0}
            delta={8.4}
            deltaLabel="vs last month"
            trend={[14, 16, 18, 20, 22, 24]}
          />
          <KpiCard
            label="This week"
            value={stats?.sessionsThisWeek ?? 0}
            color="hsl(217 91% 60%)"
          />
          <KpiCard
            label="Avg confidence"
            value={`${Math.round((stats?.avgConfidence ?? 0) * 100)}%`}
            color="hsl(160 84% 39%)"
          />
          <KpiCard
            label="Avg duration"
            value={stats?.avgDurationMs ? `${(stats.avgDurationMs / 1000).toFixed(1)}s` : "—"}
            color="hsl(32 95% 44%)"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="Sessions over time"
            description="Research sessions per week (last 6 weeks)"
            empty={false}
          >
            <LineChart
              data={[
                { label: "W1", values: [14] },
                { label: "W2", values: [16] },
                { label: "W3", values: [18] },
                { label: "W4", values: [20] },
                { label: "W5", values: [22] },
                { label: "W6", values: [24] },
              ]}
              series={[{ name: "Sessions" }]}
              area
              valueFormatter={(n) => String(Math.round(n))}
            />
          </ChartCard>

          <ChartCard
            title="Source types"
            description={`${stats?.totalAuthorities ?? 0} authorities indexed`}
            empty={byKind.length === 0}
          >
            <DonutChart
              data={byKind.map((k, i) => ({
                label: k.label,
                value: k.value,
                color: ["hsl(217 91% 60%)", "hsl(160 84% 39%)", "hsl(262 83% 58%)", "hsl(32 95% 44%)", "hsl(189 94% 43%)", "hsl(340 82% 52%)", "hsl(20 90% 48%)", "hsl(142 71% 45%)"][i % 8],
              }))}
              centerLabel="authorities"
            />
          </ChartCard>
        </div>

        <ChartCard title="Coverage by source type" description="Count of authorities indexed" empty={byKind.length === 0}>
          <HorizontalBarChart data={byKind} valueFormatter={(n) => String(n)} />
        </ChartCard>
      </div>
    </div>
  );
}
