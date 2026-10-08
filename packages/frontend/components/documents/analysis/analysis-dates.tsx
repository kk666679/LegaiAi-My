"use client";
import * as React from "react";
import type { DocumentAnalysisFinding } from "../types";
import { AnalysisFindings } from "./analysis-findings";

export function AnalysisDates({ findings, onSelect }: { findings: DocumentAnalysisFinding[]; onSelect?: (f: DocumentAnalysisFinding) => void }) {
  return <AnalysisFindings findings={findings.filter((f) => f.kind === "date")} onSelect={onSelect} />;
}
