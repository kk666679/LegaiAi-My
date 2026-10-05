// components/matters/search/matter-filter-bar.tsx
"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { MatterFilters, MatterPriority, MatterStatus } from "../types";

const STATUSES: MatterStatus[] = [
  "intake",
  "open",
  "on-hold",
  "pending",
  "review",
  "billing",
  "closed",
  "archived",
];
const PRIORITIES: MatterPriority[] = ["low", "normal", "high", "urgent"];
const PRACTICE_AREAS = [
  "Corporate",
  "Commercial",
  "Employment",
  "Litigation",
  "Property",
  "Family",
  "Criminal",
  "IP",
  "Tax",
];

export interface MatterFilterBarProps {
  filters: MatterFilters;
  onFiltersChange: (next: Partial<MatterFilters>) => void;
  onReset?: () => void;
  className?: string;
}

export function MatterFilterBar({ filters, onFiltersChange, onReset, className }: MatterFilterBarProps) {
  const activeCount =
    (filters.status?.length ?? 0) +
    (filters.priority?.length ?? 0) +
    (filters.practiceArea?.length ?? 0);

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="size-4" /> Filters
            {activeCount > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <div className="space-y-1.5">
              {STATUSES.map((s) => {
                const checked = filters.status?.includes(s) ?? false;
                return (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(filters.status ?? []);
                        v ? next.add(s) : next.delete(s);
                        onFiltersChange({ status: [...next] });
                      }}
                    />
                    {s.replace("-", " ")}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Priority</p>
            <div className="space-y-1.5">
              {PRIORITIES.map((p) => {
                const checked = filters.priority?.includes(p) ?? false;
                return (
                  <label key={p} className="flex cursor-pointer items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(filters.priority ?? []);
                        v ? next.add(p) : next.delete(p);
                        onFiltersChange({ priority: [...next] });
                      }}
                    />
                    {p}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Practice area</p>
            <div className="space-y-1.5">
              {PRACTICE_AREAS.map((p) => {
                const checked = filters.practiceArea?.includes(p) ?? false;
                return (
                  <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(filters.practiceArea ?? []);
                        v ? next.add(p) : next.delete(p);
                        onFiltersChange({ practiceArea: [...next] });
                      }}
                    />
                    {p}
                  </label>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {activeCount > 0 && onReset ? (
        <Button variant="ghost" size="sm" className="ml-2 gap-1" onClick={onReset}>
          <X className="size-3.5" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
