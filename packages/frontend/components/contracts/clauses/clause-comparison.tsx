"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContractClause } from "../types";

export interface ClauseComparisonProps {
  left: ContractClause;
  right: ContractClause;
  leftLabel?: string;
  rightLabel?: string;
}

export function ClauseComparison({ left, right, leftLabel = "Preferred", rightLabel = "Current" }: ClauseComparisonProps) {
  const differences = wordLevelDiff(left.body, right.body);
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card className="p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{leftLabel}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{left.body}</p>
      </Card>
      <Card className="p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{rightLabel}</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {differences.map((d, i) => (
            <span key={i} className={cn(d.kind === "added" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", d.kind === "removed" && "bg-destructive/15 text-destructive line-through")}>
              {d.text}
            </span>
          ))}
        </p>
      </Card>
    </div>
  );
}

interface Diff { kind: "same" | "added" | "removed"; text: string; }

function wordLevelDiff(a: string, b: string): Diff[] {
  const aw = a.split(/(\s+)/);
  const bw = b.split(/(\s+)/);
  const set = new Set(aw);
  const out: Diff[] = [];
  let lastKept = false;
  for (const w of bw) {
    if (set.has(w)) {
      out.push({ kind: "same", text: w });
      lastKept = true;
    } else if (w.trim() === "") {
      out.push({ kind: "same", text: w });
    } else {
      out.push({ kind: "added", text: w });
      lastKept = false;
    }
  }
  // Mark removed words — words in A not present in B
  const bSet = new Set(bw);
  // Interleave is complex; keep it simple: only annotate additions. (Removal highlighting requires alignment.)
  void lastKept; void bSet;
  return out;
}
