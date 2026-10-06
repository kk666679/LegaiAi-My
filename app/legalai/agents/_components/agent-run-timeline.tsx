"use client";
// app/legalai/agents/_components/agent-run-timeline.tsx
import * as React from "react";
import { AlertCircle, CheckCircle2, Circle, Loader2, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunStep } from "./types";

export function AgentRunTimeline({ steps }: { steps: RunStep[] }) {
  return (
    <ol className="space-y-2" aria-label="Run steps">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={s.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border",
                  s.status === "complete" && "border-emerald-500 bg-emerald-500/10 text-emerald-600",
                  s.status === "active" && "border-blue-500 bg-blue-500/10 text-blue-600",
                  s.status === "pending" && "border-muted text-muted-foreground",
                  s.status === "failed" && "border-destructive bg-destructive/10 text-destructive",
                )}
              >
                {s.status === "complete" ? <CheckCircle2 className="size-3" /> :
                 s.status === "active" ? <Loader2 className="size-3 animate-spin" /> :
                 s.status === "failed" ? <AlertCircle className="size-3" /> :
                 <Circle className="size-3" />}
              </span>
              {!isLast ? <span className="my-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.kind}</span>
                <span className="truncate text-sm font-medium">{s.label}</span>
                {s.confidence != null ? (
                  <span className="text-[10px] text-muted-foreground">{Math.round(s.confidence * 100)}%</span>
                ) : null}
              </div>
              {s.detail ? <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p> : null}
              {s.toolName ? (
                <div className="mt-1.5 rounded-md border border-border/60 bg-muted/30 p-2 font-mono text-[11px]">
                  <p className="text-muted-foreground">tool: {s.toolName}</p>
                  {s.toolInput ? <p className="mt-0.5 truncate">input: {JSON.stringify(s.toolInput)}</p> : null}
                  {s.toolOutput ? <p className="mt-0.5 truncate">→ {s.toolOutput}</p> : null}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
