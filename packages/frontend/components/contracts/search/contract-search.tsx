"use client";
import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { ContractFilters, ContractSort } from "../types";
import { ContractSearchBar } from "./contract-search-bar";
import { ContractFiltersBar } from "./contract-filters";
import { ContractFilterChips } from "./contract-filter-chips";
import { ContractSortSelect } from "./contract-sort";

export function ContractSearch({ filters, sort, onFiltersChange, onReset, onSortChange }: { filters: ContractFilters; sort: ContractSort; onFiltersChange: (n: Partial<ContractFilters>) => void; onReset: () => void; onSortChange: (s: ContractSort) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ContractSearchBar value={filters.query} onChange={(q) => onFiltersChange({ query: q })} className="min-w-0 flex-1" />
        <div className="hidden items-center gap-2 md:flex">
          <ContractFiltersBar filters={filters} onFiltersChange={onFiltersChange} onReset={onReset} />
          <ContractSortSelect value={sort} onChange={onSortChange} />
        </div>
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" size="icon" className="md:hidden" aria-label="Filters"><SlidersHorizontal className="size-4" /></Button></SheetTrigger>
          <SheetContent side="bottom" className="space-y-4 p-4">
            <ContractFiltersBar filters={filters} onFiltersChange={onFiltersChange} onReset={onReset} />
            <ContractSortSelect value={sort} onChange={onSortChange} />
          </SheetContent>
        </Sheet>
      </div>
      <ContractFilterChips filters={filters} onFiltersChange={onFiltersChange} />
    </div>
  );
}
