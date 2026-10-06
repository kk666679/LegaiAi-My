"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlaybookPosition, PlaybookRule } from "../types";
import { CLAUSE_CATEGORY_LABELS } from "../clauses/clause-categories";

const POSITION_TONE: Record<PlaybookPosition, string> = {
  preferred: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  acceptable: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  fallback: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "walk-away": "bg-destructive/10 text-destructive",
};

export function PlaybookPositionCard({ rule, activePosition, onSelect }: { rule: PlaybookRule; activePosition?: PlaybookPosition; onSelect?: (p: PlaybookPosition, text: string) => void }) {
  const positions: Array<{ key: PlaybookPosition; label: string; text: string }> = [
    { key: "preferred", label: "Preferred", text: rule.preferred },
    { key: "acceptable", label: "Acceptable", text: rule.acceptable },
    { key: "fallback", label: "Fallback", text: rule.fallback },
    { key: "walk-away", label: "Walk-away", text: rule.walkAway },
  ];
  return (
    <Card className="p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{CLAUSE_CATEGORY_LABELS[rule.clauseCategory]}</p>
        {rule.escalationPolicy ? <Badge variant="outline" className="text-[10px]">Escalation defined</Badge> : null}
      </div>
      <div className="space-y-1.5">
        {positions.map((p) => (
          <button key={p.key} type="button" onClick={() => onSelect?.(p.key, p.text)}
            className={cn("w-full rounded-md border p-2 text-left transition-colors", activePosition === p.key ? "border-primary ring-1 ring-primary" : "border-border/60 hover:border-primary/40")}>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("border-transparent text-[10px]", POSITION_TONE[p.key])}>{p.label}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{p.text}</p>
          </button>
        ))}
      </div>
      {rule.rationale ? <p className="mt-2 text-[11px] italic text-muted-foreground">{rule.rationale}</p> : null}
    </Card>
  );
}
