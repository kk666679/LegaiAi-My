// components/matters/charts/primitives/chart-legend.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartLegendItem {
  label: string;
  color: string;
  value?: string;
}

export function ChartLegend({
  items,
  className,
  onSelect,
}: {
  items: ChartLegendItem[];
  className?: string;
  onSelect?: (item: ChartLegendItem) => void;
}) {
  if (!items.length) return null;
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`}>
          <button
            type="button"
            onClick={() => onSelect?.(item)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm px-0.5",
              onSelect && "hover:text-foreground",
            )}
          >
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ background: item.color }}
              aria-hidden
            />
            <span>{item.label}</span>
            {item.value ? <span className="tabular-nums text-foreground/70">{item.value}</span> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
