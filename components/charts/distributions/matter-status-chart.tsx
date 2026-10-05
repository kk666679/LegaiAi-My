// components/matters/charts/distributions/matter-status-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { ChartLegend } from "../primitives/chart-legend";
import { DonutChart, type DonutDatum } from "../primitives/donut-chart";
import type { MatterStatus } from "../../matters/types";
import { MATTER_STATUS_LABELS } from "@/components/matters/status/matter-status-indicator";
import { STATUS_COLORS, formatNumber } from "../primitives/chart-utils";

export interface MatterStatusChartDatum {
  status: MatterStatus;
  count: number;
}

export interface MatterStatusChartProps {
  data: MatterStatusChartDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  onSelect?: (status: MatterStatus) => void;
}

export function MatterStatusChart({
  data,
  loading,
  error,
  onRetry,
  height = 260,
  className,
  onSelect,
}: MatterStatusChartProps) {
  const donutData: DonutDatum[] = data.map((d) => ({
    label: MATTER_STATUS_LABELS[d.status],
    value: d.count,
    color: STATUS_COLORS[d.status],
  }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ChartCard
      title="Matter status"
      description="Distribution across the current pipeline"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && total === 0}
      emptyMessage="No matters yet"
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
      <DonutChart
        data={donutData}
        height={height}
        centerLabel="matters"
        ariaLabel="Matter status distribution"
        onSelect={(d, ) => {
          const match = data.find((x) => MATTER_STATUS_LABELS[x.status] === d.label);
          if (match) onSelect?.(match.status);
        }}
      />
    </ChartCard>
  );
}
