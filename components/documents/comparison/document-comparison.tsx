"use client";
import * as React from "react";
import type { LegalDocument } from "../types";
import { ComparisonHeader } from "./comparison-header";
import { ComparisonPane } from "./comparison-pane";
import { ComparisonDiff, type DiffLine } from "./comparison-diff";
import { ComparisonSummary, type ComparisonStats } from "./comparison-summary";
import { DocumentPreview } from "../preview/document-preview";

export interface DocumentComparisonProps { left: LegalDocument; right: LegalDocument; stats?: ComparisonStats; diff?: DiffLine[]; }

export function DocumentComparison({ left, right, stats, diff }: DocumentComparisonProps) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ComparisonHeader leftLabel={left.name} rightLabel={right.name} summary={stats ? <ComparisonSummary stats={stats} /> : null} />
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <ComparisonPane label={left.name}>{diff ? <ComparisonDiff lines={diff} /> : <DocumentPreview document={left} />}</ComparisonPane>
        <ComparisonPane label={right.name}><DocumentPreview document={right} /></ComparisonPane>
      </div>
    </div>
  );
}
