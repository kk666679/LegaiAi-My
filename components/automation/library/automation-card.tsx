"use client";
import * as React from "react";
import { MoreHorizontal, Play, Workflow } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkflowMeta, WorkflowStats } from "../types";

const STATUS_TONE: Record<WorkflowMeta["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  archived: "bg-muted text-muted-foreground",
};

export interface AutomationCardProps {
  workflow: WorkflowMeta;
  stats?: WorkflowStats;
  onOpen?: (w: WorkflowMeta) => void;
  onRun?: (w: WorkflowMeta) => void;
  onMenu?: (w: WorkflowMeta, anchor: HTMLElement) => void;
  className?: string;
}

export function AutomationCard({ workflow, stats, onOpen, onRun, onMenu, className }: AutomationCardProps) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(workflow)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(workflow); }}
      className={cn("group flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:border-primary/40", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-md bg-muted p-2 text-muted-foreground"><Workflow className="size-4" /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{workflow.name}</p>
            <p className="truncate text-xs text-muted-foreground">{workflow.category ?? "General"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon" variant="ghost" className="size-7 text-muted-foreground"
            aria-label={`Run ${workflow.name}`}
            onClick={(e) => { e.stopPropagation(); onRun?.(workflow); }}
          ><Play className="size-3.5" /></Button>
          <Button
            ref={menuRef} size="icon" variant="ghost"
            className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={`Actions for ${workflow.name}`}
            onClick={(e) => { e.stopPropagation(); if (menuRef.current) onMenu?.(workflow, menuRef.current); }}
          ><MoreHorizontal className="size-4" /></Button>
        </div>
      </div>

      {workflow.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{workflow.description}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn("border-transparent text-[10px] font-medium capitalize", STATUS_TONE[workflow.status])}>{workflow.status}</Badge>
        {workflow.tags?.slice(0, 2).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
      </div>

      {stats ? (
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-[11px]">
          <div><p className="text-muted-foreground">Runs</p><p className="font-medium tabular-nums">{stats.totalRuns}</p></div>
          <div><p className="text-muted-foreground">Success</p><p className="font-medium tabular-nums">{stats.successRate.toFixed(0)}%</p></div>
          <div><p className="text-muted-foreground">Last run</p><p className="font-medium">{stats.lastRunAt ? new Date(stats.lastRunAt).toLocaleDateString() : "—"}</p></div>
        </div>
      ) : null}
    </Card>
  );
}
