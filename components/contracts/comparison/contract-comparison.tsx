"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContractVersion } from "../types";
import { ContractDiff, type DiffLine } from "./contract-diff";

export interface ContractComparisonProps {
  leftLabel: string;
  rightLabel: string;
  leftMeta?: ContractVersion;
  rightMeta?: ContractVersion;
  lines: DiffLine[];
}

export function ContractComparison({ leftLabel, rightLabel, leftMeta, rightMeta, lines }: ContractComparisonProps) {
  const stats = {
    added: lines.filter((l) => l.kind === "added").length,
    removed: lines.filter((l) => l.kind === "removed").length,
    modified: lines.filter((l) => l.kind === "modified").length,
  };
  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Comparing</p>
          <p className="truncate text-sm font-medium">{leftLabel} → {rightLabel}</p>
          {leftMeta?.createdAt && rightMeta?.createdAt ? (
            <p className="text-[11px] text-muted-foreground">{new Date(leftMeta.createdAt).toLocaleDateString()} → {new Date(rightMeta.createdAt).toLocaleDateString()}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">+{stats.added} added</Badge>
          <Badge variant="outline" className="text-destructive">−{stats.removed} removed</Badge>
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400">~{stats.modified} modified</Badge>
        </div>
      </Card>
      <ContractDiff lines={lines} />
    </div>
  );
}
