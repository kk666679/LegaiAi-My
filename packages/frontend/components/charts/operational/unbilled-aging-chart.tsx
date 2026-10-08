// components/matters/charts/operational/unbilled-aging-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { HorizontalBarChart } from "../primitives/horizontal-bar-chart";
import { formatCurrencyCompact } from "../primitives/chart-utils";

export interface UnbilledAgingRow {
  matterId: string;
  matterName: string;
  amount: number;
  daysSinceLastWork: number;
}

export interface UnbilledAgingChartProps {
  data: UnbilledAgingRow[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  currency?: string;
  topN?: number;
  onSelect?: (matterId: string) => void;
}

export function UnbilledAgingChart({
  data,
  loading,
  error,
  onRetry,
  height,
  className,
  currency = "RM",
  topN = 8,
  onSelect,
}: UnbilledAgingChartProps) {
  const sliced = React.useMemo(
    () => [...data].sort((a, b) => b.amount - a.amount).slice(0, topN),
    [data, topN],
  );

  return (
    <ChartCard
      title="Unbilled work"
      description="Largest unbilled balances"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && sliced.length === 0}
      height={height ?? Math.max(160, sliced.length * 30 + 20)}
      className={className}
    >
      <HorizontalBarChart
        data={sliced.map((d) => ({ label: d.matterName, value: d.amount }))}
        valueFormatter={(n) => formatCurrencyCompact(n, currency)}
        ariaLabel="Largest unbilled balances"
        onSelect={(d) => {
          const m = sliced.find((x) => x.matterName === d.label);
          if (m) onSelect?.(m.matterId);
        }}
      />
    </ChartCard>
  );
}
