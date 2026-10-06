"use client";
// app/legalai/agents/_components/skills-page.tsx
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAgents } from "./use-agents";

const CATEGORY_TONE: Record<string, string> = {
  research: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  drafting: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  negotiation: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  compliance: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  ops: "bg-muted text-muted-foreground",
};

export function SkillsPage() {
  const { skills } = useAgents({ scope: "all" });
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Skills</h1>
        <p className="text-xs text-muted-foreground">Reusable capabilities with golden-set coverage.</p>
      </header>
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((s) => (
          <Card key={s.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{s.name}</p>
              <Badge variant="outline" className={`border-transparent text-[10px] font-medium capitalize ${CATEGORY_TONE[s.category] ?? ""}`}>
                {s.category}
              </Badge>
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
            <div className="flex flex-wrap gap-1">
              {s.agentIds.map((id) => (
                <Badge key={id} variant="secondary" className="text-[10px] font-mono">{id}</Badge>
              ))}
            </div>
            {s.passRate != null ? (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Golden set pass rate</span>
                  <span className="tabular-nums">{Math.round(s.passRate * 100)}%</span>
                </div>
                <Progress value={s.passRate * 100} className="h-1" />
                {s.goldenCases ? (
                  <p className="text-[10px] text-muted-foreground">{s.goldenCases} test cases</p>
                ) : null}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
