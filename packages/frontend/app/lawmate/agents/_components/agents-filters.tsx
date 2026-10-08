"use client";
// app/lawmate/agents/_components/agents-filters.tsx
import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { AgentFilters, AgentStatus, AgentTier } from "./types";

const TIERS: AgentTier[] = ["orchestrator", "tier1", "tier2", "tier3"];
const STATUSES: AgentStatus[] = ["idle", "running", "thinking", "waiting", "paused", "error", "disabled"];

export interface AgentsFiltersProps {
  filters: AgentFilters;
  onFiltersChange: (next: Partial<AgentFilters>) => void;
  onReset: () => void;
  className?: string;
}

export function AgentsFilters({ filters, onFiltersChange, onReset, className }: AgentsFiltersProps) {
  const activeCount = (filters.tier?.length ?? 0) + (filters.status?.length ?? 0);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query ?? ""}
          onChange={(e) => onFiltersChange({ query: e.target.value })}
          placeholder="Search agents"
          aria-label="Search agents"
          className="pl-9"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            Filters
            {activeCount > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{activeCount}</Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tier</p>
            <div className="space-y-1.5">
              {TIERS.map((t) => {
                const checked = filters.tier?.includes(t) ?? false;
                return (
                  <label key={t} className="flex cursor-pointer items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const n = new Set(filters.tier ?? []);
                        v ? n.add(t) : n.delete(t);
                        onFiltersChange({ tier: [...n] });
                      }}
                    />
                    {t}
                  </label>
                );
              })}
            </div>
          </div>
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
                        const n = new Set(filters.status ?? []);
                        v ? n.add(s) : n.delete(s);
                        onFiltersChange({ status: [...n] });
                      }}
                    />
                    {s}
                  </label>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" className="gap-1" onClick={onReset}>
          <X className="size-3.5" /> Clear
        </Button>
      ) : null}
    </div>
  );
}
