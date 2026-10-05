// components/documents/analysis/analysis-summary.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";

export interface AnalysisSummaryProps {
  summary?: string;
  confidence?: number;
}

export function AnalysisSummary({ summary, confidence }: AnalysisSummaryProps) {
  return (
    <Card className="space-y-2 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Summary
      </p>
      <p className="text-sm leading-relaxed">{summary ?? "No summary available."}</p>
      {typeof confidence === "number" ? (
        <p className="text-[11px] text-muted-foreground">
          Overall confidence {Math.round(confidence * 100)}%
        </p>
      ) : null}
    </Card>
  );
}
