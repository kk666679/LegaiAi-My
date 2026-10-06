"use client";
// app/legalai/agents/_components/budget-page.tsx
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAgents } from "./use-agents";
import { AgentTierBadge } from "./agent-status-badge";

export function BudgetPage() {
  const { agents } = useAgents({ scope: "all" });
  const totalBudget = agents.reduce((s, a) => s + (a.dailyBudgetUsd ?? 0), 0);
  const totalSpent = agents.reduce((s, a) => s + (a.spentTodayUsd ?? 0), 0);
  const pct = totalBudget ? (totalSpent / totalBudget) * 100 : 0;
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Budget</h1>
        <p className="text-xs text-muted-foreground">Daily spend across the agent fleet.</p>
      </header>
      <div className="space-y-4 p-4">
        <Card className="space-y-2 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Today</span>
            <span className="tabular-nums text-muted-foreground">
              ${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}
            </span>
          </div>
          <Progress value={pct} className={pct >= 80 ? "[&>div]:bg-destructive" : undefined} />
          <p className="text-[11px] text-muted-foreground">
            {pct >= 80
              ? "Approaching today's aggregate budget."
              : `${Math.round(100 - pct)}% of daily budget remaining.`}
          </p>
        </Card>

        <div className="space-y-2">
          {agents.map((a) => {
            const p = a.dailyBudgetUsd ? Math.min(100, ((a.spentTodayUsd ?? 0) / a.dailyBudgetUsd) * 100) : 0;
            return (
              <Card key={a.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <AgentTierBadge tier={a.tier} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Progress value={p} className={`h-1 flex-1 ${p >= 90 ? "[&>div]:bg-destructive" : ""}`} />
                    <span className="w-28 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                      ${(a.spentTodayUsd ?? 0).toFixed(2)} / ${(a.dailyBudgetUsd ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
