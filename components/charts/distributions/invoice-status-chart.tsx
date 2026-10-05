// components/matters/charts/distributions/invoice-status-chart.tsx
"use client";

import * as React from "react";
import { ChartCard } from "../primitives/chart-card";
import { ChartLegend } from "../primitives/chart-legend";
import { DonutChart, type DonutDatum } from "../primitives/donut-chart";
import { INVOICE_COLORS, formatCurrencyCompact } from "../primitives/chart-utils";
import type { MatterInvoice } from "../../matters/types";

export interface InvoiceStatusChartDatum {
  status: MatterInvoice["status"];
  count: number;
  amount: number;
}

export interface InvoiceStatusChartProps {
  data: InvoiceStatusChartDatum[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  height?: number;
  className?: string;
  currency?: string;
}

const LABEL: Record<MatterInvoice["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export function InvoiceStatusChart({
  data,
  loading,
  error,
  onRetry,
  height = 240,
  className,
  currency = "RM",
}: InvoiceStatusChartProps) {
  const donutData: DonutDatum[] = data
    .filter((d) => d.status !== "void")
    .map((d) => ({
      label: LABEL[d.status],
      value: d.amount,
      color: INVOICE_COLORS[d.status],
    }));
  const total = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      title="Invoice status"
      description="Amounts by invoice state"
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
            value: formatCurrencyCompact(d.value, currency),
          }))}
        />
      }
    >
      <DonutChart
        data={donutData}
        height={height}
        thickness={30}
        centerLabel="invoiced"
        valueFormatter={(n) => formatCurrencyCompact(n, currency)}
        ariaLabel="Invoice status distribution"
      />
    </ChartCard>
  );
}
