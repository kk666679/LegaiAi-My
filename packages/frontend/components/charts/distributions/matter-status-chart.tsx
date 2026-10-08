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
  status: MatterStatus | "active" | "on_hold";
  count: number;
}

export interface MatterStatusChartProps {
  data: MatterStatusChartDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  onSelect?: (status: MatterStatus | "active" | "on_hold") => void;
}

function statusLabel(status: MatterStatusChartDatum["status"]): string {
  if (status === "active") return "Active";
  if (status === "on_hold") return "On Hold";
  return MATTER_STATUS_LABELS[status] ?? status;
}

function statusColor(status: MatterStatusChartDatum["status"]): string {
  if (status === "active") return STATUS_COLORS.open ?? "hsl(220 9% 46%)";
  if (status === "on_hold") return STATUS_COLORS["on-hold"] ?? "hsl(220 9% 46%)";
  return STATUS_COLORS[status] ?? "hsl(220 9% 46%)";
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
    label: statusLabel(d.status),
    value: d.count,
    color: statusColor(d.status),
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
          const match = data.find((x) => statusLabel(x.status) === d.label);
          if (match) onSelect?.(match.status);
        }}
      />
    </ChartCard>
  );
}
