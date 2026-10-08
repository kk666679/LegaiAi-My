// components/matters/charts/timeseries/revenue-trend-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { LineChart } from "../primitives/line-chart";
import { formatCurrencyCompact } from "../primitives/chart-utils";

export interface RevenueTrendDatum {
  period: string;
  billed: number;
  collected: number;
}

export interface RevenueTrendChartProps {
  data: RevenueTrendDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  currency?: string;
}

export function RevenueTrendChart({
  data,
  loading,
  error,
  onRetry,
  height = 260,
  className,
  currency = "RM",
}: RevenueTrendChartProps) {
  return (
    <ChartCard
      title="Revenue trend"
      description="Billed vs collected"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      height={height}
      className={className}
    >
      <LineChart
        data={data.map((d) => ({ label: d.period, values: [d.billed, d.collected] }))}
        series={[
          { name: "Billed", color: "hsl(217 91% 60%)" },
          { name: "Collected", color: "hsl(160 84% 39%)" },
        ]}
        height={height}
        valueFormatter={(n) => formatCurrencyCompact(n, currency)}
        ariaLabel="Revenue trend"
      />
    </ChartCard>
  );
}
