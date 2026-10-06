// components/hitl/item/hitl-threshold-list.tsx
"use client";

import * as React from "react";
import { AlertTriangle, Check } from "lucide-react";
import type { HITLThreshold } from "../types";

export interface HITLThresholdListProps {
  thresholds: HITLThreshold[];
}

export function HITLThresholdList({ thresholds }: HITLThresholdListProps) {
  if (!thresholds.length) return null;
  return (
    <ul className="space-y-1.5">
      {thresholds.map((t, i) => (
        <li key={i} className="flex items-center gap-2 text-xs">
          {t.breached ? (
            <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
          ) : (
            <Check className="size-3.5 shrink-0 text-emerald-500" />
          )}
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{t.field}</span>{" "}
            <span className="text-muted-foreground">
              {t.comparator} {t.value}
            </span>
            {t.actual ? (
              <span className="text-muted-foreground"> (actual: {t.actual})</span>
            ) : null}
          </span>
          {t.breached ? (
            <span className="shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              Breached
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}