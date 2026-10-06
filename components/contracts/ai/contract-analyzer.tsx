"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2 } from "lucide-react";
import type { ContractClause, ContractObligation, ContractRisk } from "../types";
import { RisksList } from "../risks/risks-list";
import { ObligationsList } from "../obligations/obligations-list";
import { ClauseList } from "../clauses/clause-list";

export interface ContractAnalyzerProps {
  risks?: ContractRisk[];
  obligations?: ContractObligation[];
  clauses?: ContractClause[];
  running?: boolean;
  progress?: number;
  onRun?: () => void;
}

export function ContractAnalyzer({ risks = [], obligations = [], clauses = [], running, progress, onRun }: ContractAnalyzerProps) {
  return (
    <div className="space-y-4">
      {running ? (
        <Card className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin text-primary" /><span>Analysing…</span></div>
          <Progress value={progress} className="h-1.5" />
        </Card>
      ) : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="space-y-2"><h3 className="text-sm font-medium">Risks ({risks.length})</h3><RisksList risks={risks} /></section>
        <section className="space-y-2"><h3 className="text-sm font-medium">Obligations ({obligations.length})</h3><ObligationsList obligations={obligations} /></section>
        <section className="space-y-2"><h3 className="text-sm font-medium">Clauses ({clauses.length})</h3><ClauseList clauses={clauses} /></section>
      </div>
      {onRun ? (
        <div className="text-center">
          <button type="button" onClick={onRun} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Sparkles className="size-3.5" /> Re-run analysis
          </button>
        </div>
      ) : null}
    </div>
  );
}
