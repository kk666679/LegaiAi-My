// components/documents/search/document-search.tsx
"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { DocumentFilters, DocumentSort } from "../types";
import { DocumentSearchBar } from "./document-search-bar";
import { DocumentFilterBar } from "./document-filter-bar";
import { DocumentFilterChips } from "./document-filter-chips";
import { DocumentSortSelect } from "./document-sort";

export interface DocumentSearchProps {
  filters: DocumentFilters;
  sort: DocumentSort;
  onFiltersChange: (next: Partial<DocumentFilters>) => void;
  onReset: () => void;
  onSortChange: (value: DocumentSort) => void;
}

export function DocumentSearch({
  filters,
  sort,
  onFiltersChange,
  onReset,
  onSortChange,
}: DocumentSearchProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <DocumentSearchBar
          value={filters.query}
          onChange={(q) => onFiltersChange({ query: q })}
          className="min-w-0 flex-1"
        />
        <div className="hidden items-center gap-2 md:flex">
          <DocumentFilterBar
            filters={filters}
            onFiltersChange={onFiltersChange}
            onReset={onReset}
          />
          <DocumentSortSelect value={sort} onChange={onSortChange} />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Filters">
              <SlidersHorizontal className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="space-y-4 p-4">
            <DocumentFilterBar
              filters={filters}
              onFiltersChange={onFiltersChange}
              onReset={onReset}
            />
            <DocumentSortSelect value={sort} onChange={onSortChange} />
          </SheetContent>
        </Sheet>
      </div>
      <DocumentFilterChips filters={filters} onFiltersChange={onFiltersChange} />
    </div>
  );
}
