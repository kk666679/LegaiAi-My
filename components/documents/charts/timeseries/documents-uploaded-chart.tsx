"use client";
import * as React from "react";
import { ChartCard, LineChart, formatNumber } from "@/components/matters/charts";

export interface DocumentsUploadedDatum { period: string; uploaded: number; processed: number; }
export function DocumentsUploadedChart({ data, loading, error, onRetry, height = 260 }: { data: DocumentsUploadedDatum[]; loading?: boolean; error?: string; onRetry?: () => void; height?: number }) {
  return (
    <ChartCard title="Documents over time" description="Uploaded vs processed" loading={loading} error={error} onRetry={onRetry} empty={!loading && !error && data.length === 0} height={height}>
      <LineChart data={data.map((d) => ({ label: d.period, values: [d.uploaded, d.processed] }))}
        series={[{ name: "Uploaded", color: "hsl(217 91% 60%)" }, { name: "Processed", color: "hsl(160 84% 39%)" }]}
        area height={height} valueFormatter={formatNumber} />
    </ChartCard>
  );
}
