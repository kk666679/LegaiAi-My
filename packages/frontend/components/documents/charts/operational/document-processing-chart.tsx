"use client";
import * as React from "react";
import { ChartCard, VerticalBarChart, formatNumber } from "@/components/matters/charts";

export interface ProcessingBucket { label: string; count: number; }
export function DocumentProcessingChart({ data, loading, error, onRetry, height = 240 }: { data: ProcessingBucket[]; loading?: boolean; error?: string; onRetry?: () => void; height?: number }) {
  return (
    <ChartCard title="Processing pipeline" description="Documents by processing stage" loading={loading} error={error} onRetry={onRetry} empty={!loading && !error && data.every((d) => d.count === 0)} height={height}>
      <VerticalBarChart data={data.map((d) => ({ label: d.label, values: [d.count] }))} series={[{ name: "Documents" }]} height={height} valueFormatter={formatNumber} />
    </ChartCard>
  );
}
