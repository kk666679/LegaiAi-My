// components/automation/palette/workflow-palette.tsx
"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PaletteItem } from "../types";
import { PALETTE_CATEGORIES } from "./default-palette";
import { PaletteItemRow } from "./palette-item";

export interface WorkflowPaletteProps {
  items: PaletteItem[];
  onAdd?: (item: PaletteItem) => void;
  className?: string;
}

export function WorkflowPalette({ items, onAdd, className }: WorkflowPaletteProps) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.title} ${item.description} ${item.category} ${(item.keywords ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const groups = React.useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    // Preserve canonical category order first, then any custom
    const ordered = [
      ...PALETTE_CATEGORIES.filter((c) => map.has(c)),
      ...Array.from(map.keys()).filter((c) => !PALETTE_CATEGORIES.includes(c)),
    ];
    return ordered.map((c) => [c, map.get(c)!] as const);
  }, [filtered]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="border-b border-border/60 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Library
        </p>
        <p className="mt-0.5 text-sm font-semibold">Steps & actions</p>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search steps"
            aria-label="Search steps"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {groups.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">No steps match “{query}”.</p>
        ) : (
          <div className="space-y-4 p-3">
            {groups.map(([category, categoryItems]) => (
              <section key={category} className="space-y-1">
                <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {category}
                </p>
                <div className="space-y-0.5">
                  {categoryItems.map((item, i) => (
                    <PaletteItemRow key={`${item.title}-${i}`} item={item} onAdd={onAdd} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
