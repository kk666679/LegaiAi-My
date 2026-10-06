"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { ContractTerm } from "../types";

export function ContractTerms({ terms }: { terms: ContractTerm[] }) {
  if (!terms.length) return <p className="text-sm text-muted-foreground">No terms extracted.</p>;
  return (
    <Card><dl className="divide-y divide-border/60">
      {terms.map((t) => (
        <div key={t.id} className="flex items-start justify-between gap-3 p-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.label}</dt>
          <dd className="min-w-0 flex-1 text-right text-sm">{t.value}{t.confidence != null ? <span className="ml-2 text-[10px] text-muted-foreground">{Math.round(t.confidence * 100)}%</span> : null}</dd>
        </div>
      ))}
    </dl></Card>
  );
}
