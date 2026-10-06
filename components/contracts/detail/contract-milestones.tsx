"use client";
import * as React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContractMilestone } from "../types";

export function ContractMilestones({ milestones }: { milestones: ContractMilestone[] }) {
  if (!milestones.length) return <p className="text-sm text-muted-foreground">No milestones.</p>;
  const sorted = [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return (
    <ol className="space-y-2">
      {sorted.map((m) => (
        <li key={m.id}><Card className={cn("flex items-center gap-3 p-3", m.completed && "opacity-70")}>
          {m.completed ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Circle className="size-4 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{m.label}</p>
            <p className="text-xs capitalize text-muted-foreground">{m.kind.replace("-", " ")}</p>
          </div>
          <span className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString()}</span>
        </Card></li>
      ))}
    </ol>
  );
}
