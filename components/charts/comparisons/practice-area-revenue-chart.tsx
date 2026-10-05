// components/matters/charts/comparisons/practice-area-revenue-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { HorizontalBarChart } from "../primitives/horizontal-bar-chart";
import { formatCurrencyCompact } from "../primitives/chart-utils";

export interface PracticeAreaRevenueDatum {
  practiceArea: string;
  revenue: number;
}

export interface PracticeAreaRevenueChartProps {
  data: PracticeAreaRevenueDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  currency?: string;
  onSelect?: (practiceArea: string) => void;
}

export function PracticeAreaRevenueChart({
  data,
  loading,
  error,
  onRetry,
  height,
  className,
  currency = "RM",
  onSelect,
}: PracticeAreaRevenueChartProps) {
  return (
    <ChartCard
      title="Revenue by practice"
      description="Collected or billed per practice area"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      height={height ?? Math.max(160, data.length * 30 + 20)}
      className={className}
    >
      <HorizontalBarChart
        data={data.map((d) => ({ label: d.practiceArea, value: d.revenue }))}
        valueFormatter={(n) => formatCurrencyCompact(n, currency)}
        ariaLabel="Revenue by practice area"
        onSelect={(d) => onSelect?.(d.label)}
      />
    </ChartCard>
  );
}
