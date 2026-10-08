"use client";
import * as React from "react";
import type { DocumentAnalysisFinding } from "../types";
import { AnalysisFindings } from "./analysis-findings";

export function AnalysisClauses({ findings, onSelect }: { findings: DocumentAnalysisFinding[]; onSelect?: (f: DocumentAnalysisFinding) => void }) {
  return <AnalysisFindings findings={findings.filter((f) => f.kind === "clause")} onSelect={onSelect} />;
}
