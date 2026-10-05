// components/documents/search/document-filter-chips.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocumentFilters } from "../types";

export interface DocumentFilterChipsProps {
  filters: DocumentFilters;
  onFiltersChange: (next: Partial<DocumentFilters>) => void;
}

export function DocumentFilterChips({
  filters,
  onFiltersChange,
}: DocumentFilterChipsProps) {
  const chips: Array<{ label: string; onRemove: () => void }> = [];

  filters.status?.forEach((s) =>
    chips.push({
      label: `Status: ${s}`,
      onRemove: () =>
        onFiltersChange({
          status: filters.status?.filter((x) => x !== s),
        }),
    }),
  );
  filters.type?.forEach((t) =>
    chips.push({
      label: `Type: ${t}`,
      onRemove: () =>
        onFiltersChange({
          type: filters.type?.filter((x) => x !== t),
        }),
    }),
  );
  filters.category?.forEach((c) =>
    chips.push({
      label: `Category: ${c}`,
      onRemove: () =>
        onFiltersChange({
          category: filters.category?.filter((x) => x !== c),
        }),
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
