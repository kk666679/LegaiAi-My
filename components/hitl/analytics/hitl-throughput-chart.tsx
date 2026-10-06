// components/hitl/analytics/hitl-throughput-chart.tsx
"use client";

import * as React from "react";
import { ChartCard, LineChart, formatNumber } from "@/components/matters/charts";

export interface HITLThroughputDatum {
  period: string;
  received: number;
  decided: number;
}

export interface HITLThroughputChartProps {
  data: HITLThroughputDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
}

export function HITLThroughputChart({
  data,
  loading,
  error,
  onRetry,
  height = 260,
}: HITLThroughputChartProps) {
  return (
    <ChartCard
      title="Review throughput"
      description="Received vs decided per period"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.length === 0}
      height={height}
    >
      <LineChart
        data={data.map((d) => ({ label: d.period, values: [d.received, d.decided] }))}
        series={[
          { name: "Received", color: "hsl(217 91% 60%)" },
          { name: "Decided", color: "hsl(160 84% 39%)" },
        ]}
        area
        height={height}
        valueFormatter={formatNumber}
      />
    </ChartCard>
  );
}