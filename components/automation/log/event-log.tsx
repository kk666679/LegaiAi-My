// components/automation/log/event-log.tsx
"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAutomation } from "../core/automation-context";
import type { WorkflowEvent } from "../types";

const ICON: Record<WorkflowEvent["kind"], React.ReactNode> = {
  info: <Info className="size-3.5 text-muted-foreground" />,
  action: <Info className="size-3.5 text-blue-500" />,
  success: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  warning: <AlertTriangle className="size-3.5 text-amber-500" />,
  error: <AlertCircle className="size-3.5 text-destructive" />,
};

export interface EventLogProps {
  className?: string;
  maxHeight?: number;
}

export function EventLog({ className, maxHeight = 180 }: EventLogProps) {
  const { events, clearEvents } = useAutomation();

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Event log
        </p>
        <Button size="icon" variant="ghost" className="size-6" aria-label="Clear log" onClick={clearEvents}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      <ul
        className="space-y-1 overflow-y-auto p-2 font-mono text-[11px]"
        style={{ maxHeight }}
      >
        {events.length === 0 ? (
          <li className="p-2 text-muted-foreground">No events yet.</li>
        ) : (
          events.map((e) => (
            <li key={e.id} className="flex items-start gap-2 rounded px-1.5 py-1 hover:bg-accent/40">
              <span className="mt-0.5">{ICON[e.kind]}</span>
              <span className="flex-1 truncate">{e.message}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {new Date(e.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
