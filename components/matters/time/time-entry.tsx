// components/matters/time/time-entry.tsx
"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatterTimeEntry } from "../types";

export interface TimeEntryProps {
  entry: MatterTimeEntry;
  onSelect?: (entry: MatterTimeEntry) => void;
}

export function TimeEntry({ entry, onSelect }: TimeEntryProps) {
  const hours = entry.durationMinutes / 60;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect?.(entry);
      }}
      className={cn("flex items-center gap-3 rounded-md border border-border/60 bg-card p-2.5 transition-colors hover:border-primary/40")}
    >
      <div className="rounded bg-muted p-2 text-muted-foreground">
        <Clock className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.description}</p>
        <p className="text-xs text-muted-foreground">
          {entry.userName} · {new Date(entry.date).toLocaleDateString()} · {entry.activity ?? "other"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium tabular-nums">{hours.toFixed(2)} h</p>
        {entry.billable && entry.rate ? (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            RM {(entry.rate * hours).toFixed(2)}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Non-billable</p>
        )}
      </div>
    </div>
  );
}
