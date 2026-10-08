"use client";
import * as React from "react";
import { FileText, Upload, Sparkles, Clock } from "lucide-react";
import { KpiCard } from "@/components/matters/charts";
import { DocumentStatusChart, type DocumentStatusChartDatum } from "../distributions/document-status-chart";
import { DocumentTypeChart, type DocumentTypeDatum } from "../distributions/document-type-chart";
import { DocumentsUploadedChart, type DocumentsUploadedDatum } from "../timeseries/documents-uploaded-chart";
import { DocumentProcessingChart, type ProcessingBucket } from "../operational/document-processing-chart";
import type { DocumentStatus } from "../../types";

export interface DocumentsAnalyticsDashboardProps {
  kpis: { total: number; processing: number; analysed: number; avgProcessingMinutes: number; deltas?: { total?: number; processing?: number; analysed?: number; avgProcessingMinutes?: number } };
  statusData: DocumentStatusChartDatum[];
  typeData: DocumentTypeDatum[];
  uploadedData: DocumentsUploadedDatum[];
  processingBuckets: ProcessingBucket[];
  loading?: boolean; error?: string; onRetry?: () => void; onStatusSelect?: (s: DocumentStatus) => void;
}

export function DocumentsAnalyticsDashboard({ kpis, statusData, typeData, uploadedData, processingBuckets, loading, error, onRetry, onStatusSelect }: DocumentsAnalyticsDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total documents" value={kpis.total.toLocaleString()} delta={kpis.deltas?.total} deltaLabel="vs last period" icon={<FileText className="size-4" />} trend={uploadedData.map((d) => d.uploaded)} />
        <KpiCard label="Processing" value={kpis.processing.toLocaleString()} delta={kpis.deltas?.processing} deltaLabel="vs last period" icon={<Upload className="size-4" />} color="hsl(217 91% 60%)" />
        <KpiCard label="Analysed" value={kpis.analysed.toLocaleString()} delta={kpis.deltas?.analysed} deltaLabel="vs last period" icon={<Sparkles className="size-4" />} color="hsl(262 83% 58%)" />
        <KpiCard label="Avg processing" value={`${kpis.avgProcessingMinutes.toFixed(1)}`} unit="minutes" delta={kpis.deltas?.avgProcessingMinutes} invertColor deltaLabel="vs last period" icon={<Clock className="size-4" />} color="hsl(32 95% 44%)" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DocumentStatusChart data={statusData} loading={loading} error={error} onRetry={onRetry} onSelect={onStatusSelect} />
        <DocumentTypeChart data={typeData} loading={loading} error={error} onRetry={onRetry} />
        <DocumentProcessingChart data={processingBuckets} loading={loading} error={error} onRetry={onRetry} />
      </div>
      <DocumentsUploadedChart data={uploadedData} loading={loading} error={error} onRetry={onRetry} />
    </div>
  );
}
