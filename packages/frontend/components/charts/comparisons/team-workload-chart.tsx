// components/matters/charts/comparisons/team-workload-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { HorizontalBarChart } from "../primitives/horizontal-bar-chart";

export interface TeamWorkloadDatum {
  memberId: string;
  name: string;
  openTasks: number;
  openMatters: number;
}

export interface TeamWorkloadChartProps {
  data: TeamWorkloadDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  onSelect?: (memberId: string) => void;
}

export function TeamWorkloadChart({
  data,
  loading,
  error,
  onRetry,
  height,
  className,
  onSelect,
}: TeamWorkloadChartProps) {
  return (
    <ChartCard
      title="Team workload"
      description="Open tasks per member"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      height={height ?? Math.max(160, data.length * 30 + 20)}
      className={className}
    >
      <HorizontalBarChart
        data={data.map((d) => ({ label: d.name, value: d.openTasks }))}
        valueFormatter={(n) => `${n} tasks`}
        ariaLabel="Open tasks per team member"
        onSelect={(row) => {
          const m = data.find((d) => d.name === row.label);
          if (m) onSelect?.(m.memberId);
        }}
      />
    </ChartCard>
  );
}
