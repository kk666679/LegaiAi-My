"use client";
import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ContractClause } from "../types";
import { ClauseList } from "./clause-list";

export interface ClauseExtractionProps {
  clauses: ContractClause[];
  running?: boolean;
  progress?: number;
  onExtract?: () => void;
  onSelect?: (c: ContractClause) => void;
}

export function ClauseExtraction({ clauses, running, progress, onExtract, onSelect }: ClauseExtractionProps) {
  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-medium">Clause extraction</p>
          <p className="text-xs text-muted-foreground">{clauses.length} clauses detected</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" disabled={running} onClick={onExtract}>
          <Sparkles className="size-3.5" />{running ? "Extracting…" : "Re-extract"}
        </Button>
      </Card>
      {running ? <Progress value={progress} className="h-1.5" /> : null}
      <ClauseList clauses={clauses} onSelect={onSelect} />
    </div>
  );
}
