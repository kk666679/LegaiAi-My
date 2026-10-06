"use client";
import * as React from "react";
import { AlertCircle, CheckCircle2, Circle, Loader2, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WorkflowNodeStatus } from "../types";

const ICONS: Record<WorkflowNodeStatus, React.ReactNode> = {
  idle: <Circle className="size-4 text-muted-foreground" />,
  queued: <Circle className="size-4 text-muted-foreground" />,
  running: <Loader2 className="size-4 animate-spin text-blue-500" />,
  success: <CheckCircle2 className="size-4 text-emerald-500" />,
  failed: <AlertCircle className="size-4 text-destructive" />,
  skipped: <Circle className="size-4 text-muted-foreground/40" />,
  waiting: <Pause className="size-4 text-amber-500" />,
};

export interface RunNodeResultProps {
  nodeId: string;
  nodeTitle: string;
  status: WorkflowNodeStatus;
  durationMs?: number;
  message?: string;
  input?: unknown;
  output?: unknown;
}

export function RunNodeResult({ nodeTitle, status, durationMs, message, input, output }: RunNodeResultProps) {
  const [open, setOpen] = React.useState(status === "failed");
  return (
    <Card className={cn("overflow-hidden", status === "failed" && "border-destructive/40")}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/30">
        {ICONS[status]}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{nodeTitle}</span>
          {message ? <span className="block truncate text-xs text-muted-foreground">{message}</span> : null}
        </span>
        {typeof durationMs === "number" ? <span className="text-xs tabular-nums text-muted-foreground">{durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`}</span> : null}
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border/60 bg-muted/20 p-3">
          {input ? <div><p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Input</p><pre className="overflow-x-auto rounded bg-background p-2 font-mono text-[11px]">{JSON.stringify(input, null, 2)}</pre></div> : null}
          {output ? <div><p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Output</p><pre className="overflow-x-auto rounded bg-background p-2 font-mono text-[11px]">{JSON.stringify(output, null, 2)}</pre></div> : null}
        </div>
      ) : null}
    </Card>
  );
}
