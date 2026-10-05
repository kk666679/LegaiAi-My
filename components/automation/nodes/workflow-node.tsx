// components/automation/nodes/workflow-node.tsx
"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertCircle, CheckCircle2, Loader2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNode } from "../types";
import { ACCENT_BG, ACCENT_BORDER, FALLBACK_ICON, NODE_ICONS } from "./node-icons";

const STATUS_RING: Record<string, string> = {
  idle: "",
  queued: "ring-2 ring-muted-foreground/20",
  running: "ring-2 ring-blue-500/60 animate-pulse",
  success: "ring-2 ring-emerald-500/60",
  failed: "ring-2 ring-red-500/70",
  skipped: "ring-2 ring-muted-foreground/30 opacity-60",
  waiting: "ring-2 ring-amber-500/60",
};

export function WorkflowNodeView({ data, selected }: NodeProps<WorkflowNode>) {
  const Icon = data.icon ? NODE_ICONS[data.icon] ?? FALLBACK_ICON : FALLBACK_ICON;
  const accent = data.accent ?? "slate";
  const status = data.status ?? "idle";

  return (
    <div
      className={cn(
        "group relative flex w-[240px] items-center gap-2.5 rounded-lg border bg-card p-2.5 text-left shadow-sm transition-colors",
        ACCENT_BORDER[accent],
        selected && "ring-2 ring-primary/60",
        STATUS_RING[status],
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-2 !bg-background" />
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-md", ACCENT_BG[accent])}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{data.title}</span>
          {status === "running" ? <Loader2 className="size-3 animate-spin text-blue-500" /> : null}
          {status === "success" ? <CheckCircle2 className="size-3 text-emerald-500" /> : null}
          {status === "failed" ? <AlertCircle className="size-3 text-red-500" /> : null}
          {status === "waiting" ? <Pause className="size-3 text-amber-500" /> : null}
          {status === "queued" ? <Play className="size-3 text-muted-foreground" /> : null}
        </span>
        {data.description ? (
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {data.description}
          </span>
        ) : null}
      </span>
      <span className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        ⋮⋮
      </span>
      <Handle type="source" position={Position.Right} className="!size-2 !border-2 !bg-background" />
    </div>
  );
}

export const WorkflowNodeComponent = React.memo(WorkflowNodeView);
