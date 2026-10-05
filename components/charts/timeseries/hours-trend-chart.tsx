// components/matters/charts/timeseries/hours-trend-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { VerticalBarChart } from "../primitives/vertical-bar-chart";

export interface HoursTrendDatum {
  period: string;
  billable: number;      // hours
  nonBillable: number;   // hours
}

export interface HoursTrendChartProps {
  data: HoursTrendDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
}

export function HoursTrendChart({
  data,
  loading,
  error,
  onRetry,
  height = 260,
  className,
}: HoursTrendChartProps) {
  return (
    <ChartCard
      title="Hours logged"
      description="Billable vs non-billable per period"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      height={height}
      className={className}
    >
      <VerticalBarChart
        data={data.map((d) => ({
          label: d.period,
          values: [d.billable, d.nonBillable],
        }))}
        series={[
          { name: "Billable", color: "hsl(160 84% 39%)" },
          { name: "Non-billable", color: "hsl(220 9% 60%)" },
        ]}
        mode="stacked"
        height={height}
        valueFormatter={(n) => `${n.toFixed(0)}h`}
        ariaLabel="Hours logged per period"
      />
    </ChartCard>
  );
}
