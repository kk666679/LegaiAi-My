// components/automation/runs/run-list.tsx
"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { WorkflowRun } from "../types";
import { RunStatusBadge } from "./run-status";

export interface RunListProps {
  runs: WorkflowRun[];
  onSelect?: (run: WorkflowRun) => void;
}

function formatDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
}

export function RunList({ runs, onSelect }: RunListProps) {
  if (!runs.length) {
    return (
      <p className="p-4 text-xs text-muted-foreground">
        No runs yet. Test run the workflow to see results here.
      </p>
    );
  }
  return (
    <ul className="space-y-2 p-3">
      {runs.map((r) => (
        <li key={r.id}>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(r)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect?.(r);
            }}
            className="flex cursor-pointer items-center gap-3 p-2.5 transition-colors hover:border-primary/40"
          >
            <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
              <Play className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                Run {r.id.slice(0, 8)}
                {r.trigger ? ` · ${r.trigger}` : ""}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(r.startedAt).toLocaleString()} · {formatDuration(r.durationMs)}
              </p>
            </div>
            <RunStatusBadge status={r.status} />
          </Card>
        </li>
      ))}
    </ul>
  );
}
