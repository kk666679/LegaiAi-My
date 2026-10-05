// components/matters/conflicts/conflict-card.tsx
"use client";

import * as React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MatterConflict } from "../types";

const SEVERITY_TONE: Record<MatterConflict["severity"], string> = {
  none: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  low: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  blocker: "bg-destructive/10 text-destructive",
};

export interface ConflictCardProps {
  conflict: MatterConflict;
}

export function ConflictCard({ conflict }: ConflictCardProps) {
  const clean = conflict.severity === "none" && conflict.matches.length === 0;
  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {clean ? (
            <ShieldCheck className="size-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="size-4 text-destructive" />
          )}
          <p className="text-sm font-medium">{conflict.query}</p>
        </div>
        <Badge variant="outline" className={`border-transparent text-[10px] font-medium ${SEVERITY_TONE[conflict.severity]}`}>
          {conflict.severity}
        </Badge>
      </div>
      {conflict.matches.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {conflict.matches.map((m) => (
            <li key={m.id} className="rounded border border-border/60 p-1.5">
              <p className="font-medium">{m.name}</p>
              <p className="text-muted-foreground">
                Matched on <span className="font-medium">{m.matchedOn}</span>
                {m.matterName ? ` · Matter: ${m.matterName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No conflicts detected.</p>
      )}
    </Card>
  );
}
