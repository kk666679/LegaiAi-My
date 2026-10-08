"use client";
// app/lawmate/research/_components/authority-filters.tsx
import * as React from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { AuthorityCourt, AuthorityKind, ResearchFilters } from "./types";
import { AUTHORITY_COURT_LABELS, AUTHORITY_KIND_LABELS } from "./types";

const KINDS: AuthorityKind[] = [
  "case",
  "statute",
  "regulation",
  "practice-direction",
  "secondary",
  "constitutional",
  "treaty",
  "circular",
];

const COURTS: AuthorityCourt[] = [
  "federal-court",
  "court-of-appeal",
  "high-court",
  "sessions-court",
  "magistrate-court",
  "industrial-court",
  "syariah",
  "tribunal",
];

export interface AuthorityFiltersProps {
  filters: ResearchFilters;
  onChange: (next: ResearchFilters) => void;
  onReset: () => void;
  className?: string;
}

export function AuthorityFilters({
  filters,
  onChange,
  onReset,
  className,
}: AuthorityFiltersProps) {
  const activeCount =
    (filters.kinds?.length ?? 0) +
    (filters.courts?.length ?? 0) +
    (filters.jurisdictions?.length ?? 0) +
    (filters.minConfidence ? 1 : 0) +
    (filters.minRelevance ? 1 : 0) +
    (filters.yearsFrom ? 1 : 0);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative">
        <Input
          value={filters.query ?? ""}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Filter authorities…"
          aria-label="Filter authorities"
          className="h-8 w-56 text-xs"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            Filters
            {activeCount > 0 ? (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Source types
            </p>
            <div className="space-y-1.5">
              {KINDS.map((k) => {
                const checked = filters.kinds?.includes(k) ?? false;
                return (
                  <label key={k} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const n = new Set(filters.kinds ?? []);
                        v ? n.add(k) : n.delete(k);
                        onChange({ ...filters, kinds: [...n] });
                      }}
                    />
                    {AUTHORITY_KIND_LABELS[k]}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Courts
            </p>
            <div className="space-y-1.5">
              {COURTS.map((c) => {
                const checked = filters.courts?.includes(c) ?? false;
                return (
                  <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const n = new Set(filters.courts ?? []);
                        v ? n.add(c) : n.delete(c);
                        onChange({ ...filters, courts: [...n] });
                      }}
                    />
                    {AUTHORITY_COURT_LABELS[c]}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Minimum confidence
            </p>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={filters.minConfidence ?? ""}
              onChange={(e) =>
                onChange({ ...filters, minConfidence: e.target.value ? Number(e.target.value) : undefined })
              }
              className="h-8 text-xs"
            />
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onReset}>
          <X className="size-3" /> Clear
        </Button>
      ) : null}
    </div>
  );
}