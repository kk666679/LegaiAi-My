// components/matters/charts/operational/deadline-pressure-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { VerticalBarChart } from "../primitives/vertical-bar-chart";
import { formatNumber } from "../primitives/chart-utils";

export interface DeadlinePressureBucket {
  label: string; // e.g. "Today", "1-3 days", "4-7 days", "8-14 days", "15+ days", "Overdue"
  count: number;
  color?: string;
}

export interface DeadlinePressureChartProps {
  data: DeadlinePressureBucket[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
}

const DEFAULT_COLORS: Record<string, string> = {
  Overdue: "hsl(0 84% 60%)",
  Today: "hsl(32 95% 44%)",
  "1-3 days": "hsl(40 90% 50%)",
  "4-7 days": "hsl(160 84% 39%)",
  "8-14 days": "hsl(217 91% 60%)",
  "15+ days": "hsl(220 9% 60%)",
};

export function DeadlinePressureChart({
  data,
  loading,
  error,
  onRetry,
  height = 240,
  className,
}: DeadlinePressureChartProps) {
  return (
    <ChartCard
      title="Deadline pressure"
      description="Upcoming deadlines bucketed by urgency"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.every((d) => d.count === 0)}
      height={height}
      className={className}
    >
      <VerticalBarChart
        data={data.map((d) => ({ label: d.label, values: [d.count] }))}
        series={[{ name: "Deadlines" }]}
        height={height}
        valueFormatter={formatNumber}
        ariaLabel="Deadline pressure"
      />
    </ChartCard>
  );
}

export { DEFAULT_COLORS as DEADLINE_BUCKET_COLORS };
