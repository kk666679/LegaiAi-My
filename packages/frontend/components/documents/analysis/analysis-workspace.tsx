"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentAnalysisFinding } from "../types";
import { DocumentAnalysis } from "./document-analysis";
import { AnalysisRisks } from "./analysis-risks";
import { AnalysisObligations } from "./analysis-obligations";
import { AnalysisDates } from "./analysis-dates";
import { AnalysisClauses } from "./analysis-clauses";
import { AnalysisParties } from "./analysis-parties";

export interface AnalysisWorkspaceProps { summary?: string; confidence?: number; findings: DocumentAnalysisFinding[]; onSelectFinding?: (f: DocumentAnalysisFinding) => void; }

export function AnalysisWorkspace({ summary, confidence, findings, onSelectFinding }: AnalysisWorkspaceProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="risks">Risks</TabsTrigger>
        <TabsTrigger value="obligations">Obligations</TabsTrigger>
        <TabsTrigger value="dates">Dates</TabsTrigger>
        <TabsTrigger value="clauses">Clauses</TabsTrigger>
        <TabsTrigger value="parties">Parties</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-3"><DocumentAnalysis summary={summary} confidence={confidence} findings={findings} onSelectFinding={onSelectFinding} /></TabsContent>
      <TabsContent value="risks" className="mt-3"><AnalysisRisks findings={findings} onSelect={onSelectFinding} /></TabsContent>
      <TabsContent value="obligations" className="mt-3"><AnalysisObligations findings={findings} onSelect={onSelectFinding} /></TabsContent>
      <TabsContent value="dates" className="mt-3"><AnalysisDates findings={findings} onSelect={onSelectFinding} /></TabsContent>
      <TabsContent value="clauses" className="mt-3"><AnalysisClauses findings={findings} onSelect={onSelectFinding} /></TabsContent>
      <TabsContent value="parties" className="mt-3"><AnalysisParties findings={findings} onSelect={onSelectFinding} /></TabsContent>
    </Tabs>
  );
}
