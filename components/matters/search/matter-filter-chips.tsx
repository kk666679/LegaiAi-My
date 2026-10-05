// components/matters/search/matter-filter-chips.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MatterFilters } from "../types";

export interface MatterFilterChipsProps {
  filters: MatterFilters;
  onFiltersChange: (next: Partial<MatterFilters>) => void;
}

export function MatterFilterChips({ filters, onFiltersChange }: MatterFilterChipsProps) {
  const chips: Array<{ label: string; onRemove: () => void }> = [];

  filters.status?.forEach((s) =>
    chips.push({
      label: `Status: ${s}`,
      onRemove: () => onFiltersChange({ status: filters.status?.filter((x) => x !== s) }),
    }),
  );
  filters.priority?.forEach((p) =>
    chips.push({
      label: `Priority: ${p}`,
      onRemove: () => onFiltersChange({ priority: filters.priority?.filter((x) => x !== p) }),
    }),
  );
  filters.practiceArea?.forEach((p) =>
    chips.push({
      label: `Practice: ${p}`,
      onRemove: () => onFiltersChange({ practiceArea: filters.practiceArea?.filter((x) => x !== p) }),
    }),
  );

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip, i) => (
        <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
            className="rounded-sm p-0.5 hover:bg-background/60"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
