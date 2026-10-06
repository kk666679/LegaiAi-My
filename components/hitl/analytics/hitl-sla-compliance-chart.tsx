// components/hitl/analytics/hitl-sla-compliance-chart.tsx
"use client";

import * as React from "react";
import {
  ChartCard,
  ChartLegend,
  DonutChart,
  formatNumber,
  type DonutDatum,
} from "@/components/matters/charts";

export interface HITLSLADatum {
  bucket: string;
  count: number;
  color?: string;
}

export interface HITLSlAComplianceChartProps {
  data: HITLSLADatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
}

export function HITLSlAComplianceChart({
  data,
  loading,
  error,
  onRetry,
  height = 240,
}: HITLSlAComplianceChartProps) {
  const donut: DonutDatum[] = data.map((d) => ({
    label: d.bucket,
    value: d.count,
    color: d.color,
  }));
  return (
    <ChartCard
      title="SLA compliance"
      description="Decisions by time-to-decision bucket"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && donut.length === 0}
      height={height}
      footer={
        <ChartLegend
          items={donut.map((d) => ({
            label: d.label,
            color: d.color!,
            value: formatNumber(d.value),
          }))}
        />
      }
    >
      <DonutChart data={donut} height={height} centerLabel="decisions" />
    </ChartCard>
  );
}