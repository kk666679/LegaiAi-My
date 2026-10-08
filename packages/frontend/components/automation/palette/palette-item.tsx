// components/automation/palette/palette-item.tsx
"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaletteItem } from "../types";
import { ACCENT_BG, FALLBACK_ICON, NODE_ICONS } from "../nodes/node-icons";

export interface PaletteItemRowProps {
  item: PaletteItem;
  onAdd?: (item: PaletteItem) => void;
}

export function PaletteItemRow({ item, onAdd }: PaletteItemRowProps) {
  const Icon = item.icon ? NODE_ICONS[item.icon] ?? FALLBACK_ICON : FALLBACK_ICON;
  return (
    <button
      type="button"
      onClick={() => onAdd?.(item)}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60",
      )}
    >
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", ACCENT_BG[item.accent])}>
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
      </span>
      <Button
        asChild
        size="icon"
        variant="ghost"
        className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
        tabIndex={-1}
      >
        <span aria-hidden>
          <Plus className="size-3.5" />
        </span>
      </Button>
    </button>
  );
}
