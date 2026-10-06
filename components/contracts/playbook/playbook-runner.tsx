"use client";
import * as React from "react";
import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContractClause, DeviationSeverity, PlaybookDeviation, PlaybookRule } from "../types";
import { CLAUSE_CATEGORY_LABELS } from "../clauses/clause-categories";

const DEVIATION_TONE: Record<DeviationSeverity, string> = {
  none: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  minor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  material: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

export interface PlaybookRunnerProps {
  clauses: ContractClause[];
  deviations: PlaybookDeviation[];
  rules?: PlaybookRule[];
  running?: boolean;
  onRun?: () => void;
  onResolve?: (id: string) => void;
}

export function PlaybookRunner({ deviations, running, onRun, onResolve }: PlaybookRunnerProps) {
  const unresolved = deviations.filter((d) => !d.resolved);
  const bySeverity = {
    critical: unresolved.filter((d) => d.deviation === "critical").length,
    material: unresolved.filter((d) => d.deviation === "material").length,
    minor: unresolved.filter((d) => d.deviation === "minor").length,
  };
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-4">
          <div><p className="text-[10px] uppercase text-muted-foreground">Critical</p><p className={cn("text-xl font-semibold tabular-nums", bySeverity.critical > 0 ? "text-destructive" : "")}>{bySeverity.critical}</p></div>
          <div><p className="text-[10px] uppercase text-muted-foreground">Material</p><p className="text-xl font-semibold tabular-nums text-orange-600 dark:text-orange-400">{bySeverity.material}</p></div>
          <div><p className="text-[10px] uppercase text-muted-foreground">Minor</p><p className="text-xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">{bySeverity.minor}</p></div>
        </div>
        <Button size="sm" className="gap-1.5" disabled={running} onClick={onRun}><Play className="size-3.5" />{running ? "Analysing…" : "Run playbook"}</Button>
      </Card>

      {unresolved.length === 0 ? <p className="text-sm text-muted-foreground">No deviations against the playbook.</p> : (
        <div className="space-y-2">
          {unresolved.map((d) => (
            <Card key={d.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.clauseHeading}</p>
                  <p className="text-[11px] text-muted-foreground">{CLAUSE_CATEGORY_LABELS[d.clauseId as never] ?? ""}</p>
                </div>
                <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium capitalize", DEVIATION_TONE[d.deviation])}>{d.deviation}</Badge>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                <div><p className="text-[10px] uppercase text-muted-foreground">Expected</p><p className="mt-0.5">{d.expected}</p></div>
                <div><p className="text-[10px] uppercase text-muted-foreground">Actual</p><p className="mt-0.5">{d.actual}</p></div>
              </div>
              {d.suggestion ? <p className="mt-2 rounded bg-primary/5 p-2 text-xs text-primary">{d.suggestion}</p> : null}
              {onResolve ? <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => onResolve(d.id)}>Mark resolved</Button> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
