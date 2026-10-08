// components/matters/search/matter-search.tsx
"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { MatterFilters, MatterSort } from "../types";
import { MatterSearchBar } from "./matter-search-bar";
import { MatterFilterBar } from "./matter-filter-bar";
import { MatterFilterChips } from "./matter-filter-chips";
import { MatterSortSelect } from "./matter-sort";

export interface MatterSearchProps {
  filters: MatterFilters;
  sort: MatterSort;
  onFiltersChange: (next: Partial<MatterFilters>) => void;
  onReset: () => void;
  onSortChange: (value: MatterSort) => void;
}

export function MatterSearch({ filters, sort, onFiltersChange, onReset, onSortChange }: MatterSearchProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <MatterSearchBar
          value={filters.query}
          onChange={(q) => onFiltersChange({ query: q })}
          className="min-w-0 flex-1"
        />
        <div className="hidden items-center gap-2 md:flex">
          <MatterFilterBar filters={filters} onFiltersChange={onFiltersChange} onReset={onReset} />
          <MatterSortSelect value={sort} onChange={onSortChange} />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Filters">
              <SlidersHorizontal className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="space-y-4 p-4">
            <MatterFilterBar filters={filters} onFiltersChange={onFiltersChange} onReset={onReset} />
            <MatterSortSelect value={sort} onChange={onSortChange} />
          </SheetContent>
        </Sheet>
      </div>
      <MatterFilterChips filters={filters} onFiltersChange={onFiltersChange} />
    </div>
  );
}
