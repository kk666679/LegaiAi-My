// components/matters/charts/timeseries/task-completion-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { LineChart } from "../primitives/line-chart";
import { formatNumber } from "../primitives/chart-utils";

export interface TaskCompletionDatum {
  period: string;
  created: number;
  completed: number;
}

export interface TaskCompletionChartProps {
  data: TaskCompletionDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
}

export function TaskCompletionChart({
  data,
  loading,
  error,
  onRetry,
  height = 260,
  className,
}: TaskCompletionChartProps) {
  return (
    <ChartCard
      title="Task throughput"
      description="Created vs completed"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      height={height}
      className={className}
    >
      <LineChart
        data={data.map((d) => ({ label: d.period, values: [d.created, d.completed] }))}
        series={[
          { name: "Created", color: "hsl(32 95% 44%)" },
          { name: "Completed", color: "hsl(160 84% 39%)" },
        ]}
        area
        height={height}
        valueFormatter={formatNumber}
        ariaLabel="Task completion over time"
      />
    </ChartCard>
  );
}
