"use client";
// app/legalai/agents/_components/agents-analytics.tsx
import * as React from "react";
import { KpiCard } from "@/components/charts/kpi/kpi-card";
import { ChartCard } from "@/components/charts/primitives/chart-card";
import { LineChart } from "@/components/charts/primitives/line-chart";
import { HorizontalBarChart } from "@/components/charts/primitives/horizontal-bar-chart";
import { DonutChart } from "@/components/charts/primitives/donut-chart";
import { useAgents } from "./use-agents";
import { AgentsStats } from "./agents-stats";

export function AgentsAnalyticsPage() {
  const { stats, agents } = useAgents({ scope: "all" });

  const byTier = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const a of agents) map.set(a.tier, (map.get(a.tier) ?? 0) + 1);
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [agents]);

  const spendByAgent = React.useMemo(
    () =>
      [...agents]
        .sort((a, b) => (b.spentTodayUsd ?? 0) - (a.spentTodayUsd ?? 0))
        .slice(0, 8)
        .map((a) => ({ label: a.name, value: a.spentTodayUsd ?? 0 })),
    [agents],
  );

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Agent analytics</h1>
        <p className="text-xs text-muted-foreground">Usage, cost, and reliability across the fleet.</p>
      </header>
      <div className="space-y-4 p-4">
        {stats ? <AgentsStats stats={stats} /> : null}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Runs (24h)" value={stats?.runs24h ?? 0} trend={[120, 132, 145, 160, 172, 217]} />
          <KpiCard
            label="Failure rate"
            value={`${((stats?.failureRate24h ?? 0) * 100).toFixed(1)}%`}
            invertColor
            color="hsl(0 84% 60%)"
          />
          <KpiCard
            label="Spend today"
            value={`$${(stats?.totalSpendTodayUsd ?? 0).toFixed(2)}`}
            trend={[18, 22, 26, 30, 24, 34]}
            color="hsl(32 95% 44%)"
          />
          <KpiCard label="Active runs" value={stats?.activeRuns ?? 0} color="hsl(262 83% 58%)" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="Runs over time"
            description="Total agent runs per day (7-day window)"
            empty={false}
          >
            <LineChart
              data={[
                { label: "Mon", values: [180] },
                { label: "Tue", values: [210] },
                { label: "Wed", values: [240] },
                { label: "Thu", values: [220] },
                { label: "Fri", values: [260] },
                { label: "Sat", values: [190] },
                { label: "Sun", values: [217] },
              ]}
              series={[{ name: "Runs" }]}
              area
              valueFormatter={(n) => String(Math.round(n))}
            />
          </ChartCard>
          <ChartCard title="By tier" description="Agent count by tier" empty={byTier.length === 0}>
            <DonutChart
              data={byTier.map((t, i) => ({ label: t.label, value: t.value, color: ["hsl(262 83% 58%)", "hsl(217 91% 60%)", "hsl(189 94% 43%)", "hsl(32 95% 44%)"][i % 4] }))}
              centerLabel="agents"
            />
          </ChartCard>
        </div>
        <ChartCard title="Spend by agent" description="Today's spend per agent (top 8)" empty={spendByAgent.length === 0}>
          <HorizontalBarChart data={spendByAgent} valueFormatter={(n) => `$${n.toFixed(2)}`} />
        </ChartCard>
      </div>
    </div>
  );
}
