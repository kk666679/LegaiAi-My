"use client";
import * as React from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContractClause } from "../types";
import { CLAUSE_CATEGORY_LABELS } from "./clause-categories";

const DEVIATION_TONE: Record<string, string> = {
  none: "bg-muted text-muted-foreground",
  minor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  material: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  critical: "bg-destructive/10 text-destructive",
};

export function ClauseCard({ clause, onSelect }: { clause: ContractClause; onSelect?: (c: ContractClause) => void }) {
  return (
    <Card role="button" tabIndex={0} onClick={() => onSelect?.(clause)} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(clause); }}
      className="cursor-pointer p-3 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-2">
        <div className="rounded bg-muted p-1.5 text-muted-foreground"><FileText className="size-3.5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{clause.number ? `${clause.number}. ` : ""}{clause.heading}</p>
            {clause.playbookDeviation && clause.playbookDeviation !== "none" ? (
              <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium capitalize", DEVIATION_TONE[clause.playbookDeviation])}>
                <AlertTriangle className="mr-1 size-2.5" />{clause.playbookDeviation}
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">{clause.body}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <Badge variant="secondary" className="text-[10px]">{CLAUSE_CATEGORY_LABELS[clause.category]}</Badge>
            {clause.pageNumber ? <span>Page {clause.pageNumber}</span> : null}
            {clause.confidence != null ? <span>{Math.round(clause.confidence * 100)}% confidence</span> : null}
          </div>
          {clause.playbookNote ? <p className="mt-1.5 rounded bg-amber-500/10 p-1.5 text-xs text-amber-700 dark:text-amber-400">{clause.playbookNote}</p> : null}
        </div>
      </div>
    </Card>
  );
}
