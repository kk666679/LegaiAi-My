// components/matters/charts/comparisons/client-concentration-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { HorizontalBarChart } from "../primitives/horizontal-bar-chart";
import { formatCurrencyCompact } from "../primitives/chart-utils";

export interface ClientConcentrationDatum {
  clientId: string;
  clientName: string;
  revenue: number;
}

export interface ClientConcentrationChartProps {
  data: ClientConcentrationDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  currency?: string;
  topN?: number;
  onSelect?: (clientId: string) => void;
}

export function ClientConcentrationChart({
  data,
  loading,
  error,
  onRetry,
  height,
  className,
  currency = "RM",
  topN = 8,
  onSelect,
}: ClientConcentrationChartProps) {
  const sliced = React.useMemo(
    () => [...data].sort((a, b) => b.revenue - a.revenue).slice(0, topN),
    [data, topN],
  );

  return (
    <ChartCard
      title="Top clients"
      description={`Top ${topN} by revenue`}
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && sliced.length === 0}
      height={height ?? Math.max(160, sliced.length * 30 + 20)}
      className={className}
    >
      <HorizontalBarChart
        data={sliced.map((d) => ({ label: d.clientName, value: d.revenue }))}
        valueFormatter={(n) => formatCurrencyCompact(n, currency)}
        ariaLabel="Top clients by revenue"
        onSelect={(d) => {
          const m = sliced.find((x) => x.clientName === d.label);
          if (m) onSelect?.(m.clientId);
        }}
      />
    </ChartCard>
  );
}
