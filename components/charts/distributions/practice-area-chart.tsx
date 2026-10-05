// components/matters/charts/distributions/practice-area-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { HorizontalBarChart } from "../primitives/horizontal-bar-chart";
import { formatNumber } from "../primitives/chart-utils";

export interface PracticeAreaDatum {
  practiceArea: string;
  count: number;
}

export interface PracticeAreaChartProps {
  data: PracticeAreaDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  onSelect?: (practiceArea: string) => void;
}

export function PracticeAreaChart({
  data,
  loading,
  error,
  onRetry,
  height,
  className,
  onSelect,
}: PracticeAreaChartProps) {
  return (
    <ChartCard
      title="Practice area mix"
      description="Active matters by practice"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      emptyMessage="No matters yet"
      height={height ?? Math.max(160, data.length * 28 + 20)}
      className={className}
    >
      <HorizontalBarChart
        data={data.map((d) => ({ label: d.practiceArea, value: d.count }))}
        valueFormatter={formatNumber}
        ariaLabel="Matters by practice area"
        onSelect={(d) => onSelect?.(d.label)}
      />
    </ChartCard>
  );
}
