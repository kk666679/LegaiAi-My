// components/matters/deadlines/matter-deadlines.tsx
"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatterDeadline } from "../types";
import { DeadlineCard } from "./deadline-card";

export interface MatterDeadlinesProps {
  deadlines: MatterDeadline[];
  onAdd?: () => void;
  onSelect?: (deadline: MatterDeadline) => void;
}

export function MatterDeadlines({ deadlines, onAdd, onSelect }: MatterDeadlinesProps) {
  const upcoming = deadlines
    .filter((d) => !d.completed)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const done = deadlines.filter((d) => d.completed);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{upcoming.length} upcoming</p>
        {onAdd ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAdd}>
            <Plus className="size-3.5" /> Add deadline
          </Button>
        ) : null}
      </div>
      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
        ) : (
          upcoming.map((d) => <DeadlineCard key={d.id} deadline={d} onSelect={onSelect} />)
        )}
      </div>
      {done.length > 0 ? (
        <details className="rounded-md border border-border/60 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Completed ({done.length})
          </summary>
          <div className="mt-2 space-y-2">
            {done.map((d) => (
              <DeadlineCard key={d.id} deadline={d} onSelect={onSelect} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
