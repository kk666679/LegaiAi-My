// components/matters/time/matter-time.tsx
"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatterTimeEntry } from "../types";
import { TimeEntry } from "./time-entry";
import { TimeTimer } from "./time-timer";

export interface MatterTimeProps {
  matterId: string;
  entries: MatterTimeEntry[];
  onAdd?: () => void;
  onSaveTimer?: (entry: { description: string; durationMinutes: number }) => void;
  onSelect?: (entry: MatterTimeEntry) => void;
}

export function MatterTime({ matterId, entries, onAdd, onSaveTimer, onSelect }: MatterTimeProps) {
  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const billableMinutes = entries.filter((e) => e.billable).reduce((s, e) => s + e.durationMinutes, 0);

  return (
    <div className="space-y-4">
      <TimeTimer matterId={matterId} onSave={onSaveTimer} />

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-md border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-medium tabular-nums">{(totalMinutes / 60).toFixed(2)} h</p>
        </div>
        <div className="rounded-md border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Billable</p>
          <p className="font-medium tabular-nums">{(billableMinutes / 60).toFixed(2)} h</p>
        </div>
        <div className="rounded-md border border-border/60 p-2">
          <p className="text-xs text-muted-foreground">Non-billable</p>
          <p className="font-medium tabular-nums">{((totalMinutes - billableMinutes) / 60).toFixed(2)} h</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{entries.length} entries</p>
        {onAdd ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAdd}>
            <Plus className="size-3.5" /> Log time
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time entries yet.</p>
        ) : (
          entries.map((e) => <TimeEntry key={e.id} entry={e} onSelect={onSelect} />)
        )}
      </div>
    </div>
  );
}
