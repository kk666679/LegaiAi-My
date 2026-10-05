"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export interface ContractInsight { id: string; title: string; detail?: string; severity?: "low" | "medium" | "high"; }
export function ContractInsights({ insights }: { insights: ContractInsight[] }) {
  if (!insights.length) return <p className="text-sm text-muted-foreground">Run analysis to surface insights.</p>;
  return (
    <ul className="space-y-2">
      {insights.map((i) => (
        <li key={i.id}><Card className="flex items-start gap-2 p-3">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{i.title}</p>
            {i.detail ? <p className="text-xs text-muted-foreground">{i.detail}</p> : null}
          </div>
          {i.severity ? <span className="ml-auto text-[10px] uppercase text-muted-foreground">{i.severity}</span> : null}
        </Card></li>
      ))}
    </ul>
  );
}
