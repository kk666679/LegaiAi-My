"use client";
import * as React from "react";
import { ChartCard, DonutChart, ChartLegend, STATUS_COLORS, formatNumber, type DonutDatum } from "@/components/matters/charts";
import type { DocumentStatus } from "../../types";
import { STATUS_LABELS } from "../../status/document-status-indicator";

export interface DocumentStatusChartDatum { status: DocumentStatus; count: number; }
export interface DocumentStatusChartProps { data: DocumentStatusChartDatum[]; loading?: boolean; error?: string; onRetry?: () => void; height?: number; onSelect?: (s: DocumentStatus) => void; }

export function DocumentStatusChart({ data, loading, error, onRetry, height = 240, onSelect }: DocumentStatusChartProps) {
  const donut: DonutDatum[] = data.map((d) => ({ label: STATUS_LABELS[d.status], value: d.count, color: STATUS_COLORS[d.status] }));
  return (
    <ChartCard title="Document status" description="Distribution across the pipeline" loading={loading} error={error} onRetry={onRetry} empty={!loading && !error && data.length === 0} height={height}
      footer={<ChartLegend items={donut.map((d) => ({ label: d.label, color: d.color!, value: formatNumber(d.value) }))} />}>
      <DonutChart data={donut} height={height} centerLabel="documents" onSelect={(d) => {
        const match = data.find((x) => STATUS_LABELS[x.status] === d.label);
        if (match) onSelect?.(match.status);
      }} />
    </ChartCard>
  );
}
