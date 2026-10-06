"use client";
import * as React from "react";
import type { WorkflowNodeStatus } from "../types";

export interface RunTimelineStep { nodeId: string; title: string; startedAt: string; durationMs: number; status: WorkflowNodeStatus; }
export function RunTimeline({ steps }: { steps: RunTimelineStep[] }) {
  const total = steps.reduce((s, x) => s + x.durationMs, 0) || 1;
  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.nodeId} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate font-medium">{s.title}</span>
            <span className="tabular-nums text-muted-foreground">{s.durationMs}ms</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={s.status === "failed" ? "h-full bg-destructive" : s.status === "success" ? "h-full bg-emerald-500" : "h-full bg-blue-500"} style={{ width: `${(s.durationMs / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
