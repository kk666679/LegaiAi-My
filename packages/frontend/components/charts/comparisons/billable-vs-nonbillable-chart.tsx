// components/matters/charts/comparisons/billable-vs-nonbillable-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { ChartLegend } from "../primitives/chart-legend";
import { DonutChart, type DonutDatum } from "../primitives/donut-chart";

export interface BillableVsNonBillableChartProps {
  billableHours: number;
  nonBillableHours: number;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
}

export function BillableVsNonBillableChart({
  billableHours,
  nonBillableHours,
  loading,
  error,
  onRetry,
  height = 240,
  className,
}: BillableVsNonBillableChartProps) {
  const data: DonutDatum[] = [
    { label: "Billable", value: billableHours, color: "hsl(160 84% 39%)" },
    { label: "Non-billable", value: nonBillableHours, color: "hsl(220 9% 60%)" },
  ];
  const total = billableHours + nonBillableHours;

  return (
    <ChartCard
      title="Billable split"
      description="Share of hours that are billable"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && total === 0}
      height={height}
      className={className}
      footer={
        <ChartLegend
          items={data.map((d) => ({
            label: d.label,
            color: d.color!,
            value: `${d.value.toFixed(1)} h`,
          }))}
        />
      }
    >
      <DonutChart
        data={data}
        height={height}
        thickness={28}
        centerLabel="hours"
        valueFormatter={(n) => `${n.toFixed(0)}h`}
        ariaLabel="Billable vs non-billable hours"
      />
    </ChartCard>
  );
}
