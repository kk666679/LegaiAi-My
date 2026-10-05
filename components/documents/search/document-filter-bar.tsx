// components/documents/search/document-filter-bar.tsx
"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { DocumentFilters, DocumentStatus } from "../types";

const STATUSES: DocumentStatus[] = [
  "draft",
  "processing",
  "ready",
  "analysing",
  "analysed",
  "review",
  "approved",
  "final",
  "archived",
];

const TYPES = [
  "Contract",
  "Agreement",
  "NDA",
  "Policy",
  "Pleading",
  "Brief",
  "Memo",
  "Letter",
];

export interface DocumentFilterBarProps {
  filters: DocumentFilters;
  onFiltersChange: (next: Partial<DocumentFilters>) => void;
  onReset?: () => void;
  className?: string;
}

export function DocumentFilterBar({
  filters,
  onFiltersChange,
  onReset,
  className,
}: DocumentFilterBarProps) {
  const activeCount =
    (filters.status?.length ?? 0) +
    (filters.type?.length ?? 0) +
    (filters.tagIds?.length ?? 0) +
    (filters.category?.length ?? 0);

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="size-4" />
            Filters
            {activeCount > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <div className="space-y-1.5">
              {STATUSES.map((status) => {
                const checked = filters.status?.includes(status) ?? false;
                return (
                  <label
                    key={status}
                    className="flex cursor-pointer items-center gap-2 text-sm capitalize"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(filters.status ?? []);
                        if (v) next.add(status);
                        else next.delete(status);
                        onFiltersChange({ status: Array.from(next) });
                      }}
                    />
                    {status.replace("-", " ")}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Type
            </p>
            <div className="space-y-1.5">
              {TYPES.map((type) => {
                const checked = filters.type?.includes(type) ?? false;
                return (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(filters.type ?? []);
                        if (v) next.add(type);
                        else next.delete(type);
                        onFiltersChange({ type: Array.from(next) });
                      }}
                    />
                    {type}
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
