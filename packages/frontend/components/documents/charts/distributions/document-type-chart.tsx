"use client";
import * as React from "react";
import { ChartCard, HorizontalBarChart, formatNumber } from "@/components/matters/charts";

export interface DocumentTypeDatum { type: string; count: number; }
export function DocumentTypeChart({ data, loading, error, onRetry, height, onSelect }: { data: DocumentTypeDatum[]; loading?: boolean; error?: string; onRetry?: () => void; height?: number; onSelect?: (t: string) => void }) {
  return (
    <ChartCard title="Document types" description="Count by document type" loading={loading} error={error} onRetry={onRetry} empty={!loading && !error && data.length === 0} height={height ?? Math.max(160, data.length * 28 + 20)}>
      <HorizontalBarChart data={data.map((d) => ({ label: d.type, value: d.count }))} valueFormatter={formatNumber} onSelect={(d) => onSelect?.(d.label)} />
    </ChartCard>
  );
}
