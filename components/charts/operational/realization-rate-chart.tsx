// components/matters/charts/operational/realization-rate-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { HorizontalBarChart } from "../primitives/horizontal-bar-chart";

export interface RealizationDatum {
  label: string; // practice area or team member
  workedHours: number;
  billedHours: number;
  realization: number; // 0..100 percent
}

export interface RealizationRateChartProps {
  data: RealizationDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
}

export function RealizationRateChart({
  data,
  loading,
  error,
  onRetry,
  height,
  className,
}: RealizationRateChartProps) {
  return (
    <ChartCard
      title="Realization rate"
      description="Billed hours as % of worked hours"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      height={height ?? Math.max(160, data.length * 30 + 20)}
      className={className}
    >
      <HorizontalBarChart
        data={data.map((d) => ({
          label: d.label,
          value: d.realization,
          color:
            d.realization >= 85
              ? "hsl(160 84% 39%)"
              : d.realization >= 70
              ? "hsl(40 90% 50%)"
              : "hsl(0 84% 60%)",
        }))}
        valueFormatter={(n) => `${n.toFixed(0)}%`}
        ariaLabel="Realization rate"
      />
    </ChartCard>
  );
}
