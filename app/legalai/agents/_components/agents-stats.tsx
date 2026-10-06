"use client";
// app/legalai/agents/_components/agents-stats.tsx
import * as React from "react";
import { AlertCircle, Bot, CircleDollarSign, PlayCircle, ShieldAlert, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AgentStats } from "./types";

export function AgentsStats({ stats }: { stats: AgentStats }) {
  const cells = [
    { label: "Total agents", value: stats.total, icon: <Bot className="size-4" /> },
    { label: "Running", value: stats.running, icon: <PlayCircle className="size-4" />, tone: "text-blue-600 dark:text-blue-400" },
    { label: "Errors", value: stats.error, icon: <AlertCircle className="size-4" />, tone: stats.error > 0 ? "text-destructive" : undefined },
    { label: "Active runs", value: stats.activeRuns, icon: <Zap className="size-4" /> },
    { label: "Pending HITL", value: stats.pendingHitl, icon: <ShieldAlert className="size-4" /> },
    {
      label: "Spend today",
      value: `$${stats.totalSpendTodayUsd.toFixed(2)} / $${stats.totalBudgetTodayUsd.toFixed(2)}`,
      icon: <CircleDollarSign className="size-4" />,
      tone: stats.totalSpendTodayUsd / stats.totalBudgetTodayUsd >= 0.8 ? "text-destructive" : undefined,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {cells.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <span className={cn("text-muted-foreground", c.tone)}>{c.icon}</span>
          </div>
          <p className={cn("mt-1 text-xl font-semibold tabular-nums", c.tone)}>{c.value}</p>
        </Card>
      ))}
    </div>
  );
}
