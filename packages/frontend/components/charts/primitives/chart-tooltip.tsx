// components/matters/charts/primitives/chart-tooltip.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartTooltipState {
  x: number;
  y: number;
  title?: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}

export function ChartTooltip({
  state,
  containerWidth,
  className,
}: {
  state: ChartTooltipState | null;
  containerWidth: number;
  className?: string;
}) {
  if (!state) return null;

  // Keep tooltip within the container
  const TOOLTIP_W = 180;
  const left = Math.min(
    Math.max(8, state.x + 12),
    Math.max(8, containerWidth - TOOLTIP_W - 8),
  );

  return (
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none absolute z-10 min-w-[140px] max-w-[220px] rounded-md border border-border/60 bg-popover/95 px-2.5 py-2 text-xs shadow-md backdrop-blur",
        className,
      )}
      style={{ left, top: Math.max(8, state.y - 8), transform: "translateY(-100%)" }}
    >
      {state.title ? (
        <p className="mb-1.5 font-medium text-foreground">{state.title}</p>
      ) : null}
      <ul className="space-y-0.5">
        {state.rows.map((row, i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 truncate text-muted-foreground">
              {row.color ? (
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: row.color }}
                  aria-hidden
                />
              ) : null}
              <span className="truncate">{row.label}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
