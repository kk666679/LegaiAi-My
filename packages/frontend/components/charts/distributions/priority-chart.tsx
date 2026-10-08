// components/matters/charts/distributions/priority-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { ChartLegend } from "../primitives/chart-legend";
import { DonutChart, type DonutDatum } from "../primitives/donut-chart";
import { PRIORITY_COLORS, formatNumber } from "../primitives/chart-utils";
import type { MatterPriority } from "../../matters/types";

const LABEL: Record<MatterPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export interface PriorityChartDatum {
  priority: MatterPriority;
  count: number;
}

export interface PriorityChartProps {
  data: PriorityChartDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
}

export function PriorityChart({
  data,
  loading,
  error,
  onRetry,
  height = 240,
  className,
}: PriorityChartProps) {
  const donutData: DonutDatum[] = data.map((d) => ({
    label: LABEL[d.priority],
    value: d.count,
    color: PRIORITY_COLORS[d.priority],
  }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ChartCard
      title="Priority mix"
      description="Open matters by priority"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && total === 0}
      height={height}
      className={className}
      footer={
        <ChartLegend
          items={donutData.map((d) => ({
            label: d.label,
            color: d.color!,
            value: formatNumber(d.value),
          }))}
        />
      }
    >
      <DonutChart data={donutData} height={height} thickness={26} centerLabel="open" ariaLabel="Matter priority distribution" />
    </ChartCard>
  );
}
