// components/matters/charts/timeseries/matters-opened-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { LineChart } from "../primitives/line-chart";
import { formatNumber } from "../primitives/chart-utils";

export interface MattersOpenedDatum {
  period: string; // e.g. "Jan", "2026-01"
  opened: number;
  closed: number;
}

export interface MattersOpenedChartProps {
  data: MattersOpenedDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
}

export function MattersOpenedChart({
  data,
  loading,
  error,
  onRetry,
  height = 260,
  className,
}: MattersOpenedChartProps) {
  return (
    <ChartCard
      title="Matters over time"
      description="Opened vs closed per period"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      height={height}
      className={className}
    >
      <LineChart
        data={data.map((d) => ({ label: d.period, values: [d.opened, d.closed] }))}
        series={[
          { name: "Opened", color: "hsl(217 91% 60%)" },
          { name: "Closed", color: "hsl(160 84% 39%)" },
        ]}
        area
        height={height}
        valueFormatter={formatNumber}
        ariaLabel="Matters opened and closed over time"
      />
    </ChartCard>
  );
}
