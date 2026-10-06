"use client";
import * as React from "react";
import { MoreHorizontal, Play, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkflowMeta } from "../types";

export interface AutomationRowProps {
  workflow: WorkflowMeta;
  onOpen?: (w: WorkflowMeta) => void;
  onRun?: (w: WorkflowMeta) => void;
  onMenu?: (w: WorkflowMeta, anchor: HTMLElement) => void;
  className?: string;
}

export function AutomationRow({ workflow, onOpen, onRun, onMenu, className }: AutomationRowProps) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div
      role="button" tabIndex={0}
      onClick={() => onOpen?.(workflow)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(workflow); }}
      className={cn("group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-primary/40", className)}
    >
      <div className="rounded bg-muted p-2 text-muted-foreground"><Workflow className="size-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{workflow.name}</p>
        <p className="truncate text-xs text-muted-foreground">{workflow.description ?? workflow.category ?? "—"}</p>
      </div>
      <span className="hidden w-20 truncate text-xs capitalize text-muted-foreground sm:block">{workflow.status}</span>
      <span className="hidden w-24 truncate text-xs text-muted-foreground md:block">{new Date(workflow.updatedAt).toLocaleDateString()}</span>
      <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" aria-label="Run" onClick={(e) => { e.stopPropagation(); onRun?.(workflow); }}><Play className="size-3.5" /></Button>
      <Button ref={menuRef} size="icon" variant="ghost" className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" aria-label="Actions" onClick={(e) => { e.stopPropagation(); if (menuRef.current) onMenu?.(workflow, menuRef.current); }}><MoreHorizontal className="size-4" /></Button>
    </div>
  );
}
