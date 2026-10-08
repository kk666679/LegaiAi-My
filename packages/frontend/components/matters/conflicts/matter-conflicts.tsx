// components/matters/conflicts/matter-conflicts.tsx
"use client";

import * as React from "react";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatterConflict } from "../types";
import { ConflictCard } from "./conflict-card";

export interface MatterConflictsProps {
  conflicts: MatterConflict[];
  onRun?: () => void;
}

export function MatterConflicts({ conflicts, onRun }: MatterConflictsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{conflicts.length} conflict checks</p>
        {onRun ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onRun}>
            <PlayCircle className="size-3.5" /> Run check
          </Button>
        ) : null}
      </div>
      {conflicts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No conflict checks run yet.</p>
      ) : (
        <div className="space-y-2">
          {conflicts.map((c) => (
            <ConflictCard key={c.id} conflict={c} />
          ))}
        </div>
      )}
    </div>
  );
}
