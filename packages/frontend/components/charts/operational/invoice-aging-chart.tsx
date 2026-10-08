// components/matters/charts/operational/invoice-aging-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { VerticalBarChart } from "../primitives/vertical-bar-chart";
import { formatCurrencyCompact } from "../primitives/chart-utils";

export interface InvoiceAgingBucket {
  label: string; // "Current", "1-30", "31-60", "61-90", "90+"
  amount: number;
  count: number;
}

export interface InvoiceAgingChartProps {
  data: InvoiceAgingBucket[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  currency?: string;
}

const AGING_COLORS: Record<string, string> = {
  Current: "hsl(160 84% 39%)",
  "1-30": "hsl(40 90% 50%)",
  "31-60": "hsl(32 95% 44%)",
  "61-90": "hsl(20 90% 48%)",
  "90+": "hsl(0 84% 60%)",
};

export function InvoiceAgingChart({
  data,
  loading,
  error,
  onRetry,
  height = 240,
  className,
  currency = "RM",
}: InvoiceAgingChartProps) {
  return (
    <ChartCard
      title="Invoice aging"
      description="Outstanding balances by age bucket"
      loading={loading}
      error={error}
      onRetry={onRetry}
      empty={!loading && !error && data.every((d) => d.amount === 0)}
      height={height}
      className={className}
    >
      <VerticalBarChart
        data={data.map((d) => ({ label: d.label, values: [d.amount] }))}
        series={[{ name: "Outstanding" }]}
        height={height}
        valueFormatter={(n) => formatCurrencyCompact(n, currency)}
        ariaLabel="Invoice aging"
      />
    </ChartCard>
  );
}

export { AGING_COLORS };
