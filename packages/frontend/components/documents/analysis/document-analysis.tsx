// components/documents/analysis/document-analysis.tsx
"use client";

import * as React from "react";
import type { DocumentAnalysisFinding } from "../types";
import { AnalysisSummary } from "./analysis-summary";
import { AnalysisFindings } from "./analysis-findings";

export interface DocumentAnalysisProps {
  summary?: string;
  confidence?: number;
  findings: DocumentAnalysisFinding[];
  onSelectFinding?: (finding: DocumentAnalysisFinding) => void;
}

export function DocumentAnalysis({
  summary,
  confidence,
  findings,
  onSelectFinding,
}: DocumentAnalysisProps) {
  return (
    <div className="space-y-4 p-4">
      <AnalysisSummary summary={summary} confidence={confidence} />
      <section aria-labelledby="findings-heading" className="space-y-2">
        <h2 id="findings-heading" className="text-sm font-medium">
          Key findings
        </h2>
        <AnalysisFindings findings={findings} onSelect={onSelectFinding} />
      </section>
    </div>
  );
}
