// components/hitl/queue/hitl-queue-filters.tsx
"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  HITLFilters,
  HITLPriority,
  HITLRequestKind,
  HITLSourceDomain,
  HITLStatus,
} from "../types";

const STATUSES: HITLStatus[] = [
  "pending",
  "in-review",
  "escalated",
  "changes-requested",
  "approved",
  "rejected",
  "deferred",
];

const PRIORITIES: HITLPriority[] = ["low", "normal", "high", "urgent"];

const KINDS: HITLRequestKind[] = [
  "ai-draft-review",
  "ai-analysis-review",
  "document-approval",
  "contract-approval",
  "matter-opening",
  "conflict-resolution",
  "high-value-action",
  "low-confidence-ai",
  "regulatory-review",
  "escalation",
];

const DOMAINS: HITLSourceDomain[] = [
  "documents",
  "matters",
  "contracts",
  "automation",
  "ai",
];

export interface HITLQueueFiltersProps {
  filters: HITLFilters;
  onFiltersChange: (next: Partial<HITLFilters>) => void;
  onReset?: () => void;
  className?: string;
}

export function HITLQueueFilters({
  filters,
  onFiltersChange,
  onReset,
  className,
}: HITLQueueFiltersProps) {
  const active =
    (filters.status?.length ?? 0) +
    (filters.priority?.length ?? 0) +
    (filters.kind?.length ?? 0) +
    (filters.domain?.length ?? 0) +
    (filters.breachedSLA ? 1 : 0);

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="size-4" />
            Filters
            {active > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {active}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
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
                    {s.replace("-", " ")}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Priority
            </p>
            <div className="space-y-1.5">
              {PRIORITIES.map((p) => {
                const checked = filters.priority?.includes(p) ?? false;
                return (
                  <label key={p} className="flex cursor-pointer items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const n = new Set(filters.priority ?? []);
                        v ? n.add(p) : n.delete(p);
                        onFiltersChange({ priority: [...n] });
                      }}
                    />
                    {p}
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
              {KINDS.map((k) => {
                const checked = filters.kind?.includes(k) ?? false;
                return (
                  <label key={k} className="flex cursor-pointer items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const n = new Set(filters.kind ?? []);
                        v ? n.add(k) : n.delete(k);
                        onFiltersChange({ kind: [...n] });
                      }}
                    />
                    {k.replace("-", " ")}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Source
            </p>
            <div className="space-y-1.5">
              {DOMAINS.map((d) => {
                const checked = filters.domain?.includes(d) ?? false;
                return (
                  <label key={d} className="flex cursor-pointer items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const n = new Set(filters.domain ?? []);
                        v ? n.add(d) : n.delete(d);
                        onFiltersChange({ domain: [...n] });
                      }}
                    />
                    {d}
                  </label>
                );
              })}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(filters.breachedSLA)}
              onCheckedChange={(v) => onFiltersChange({ breachedSLA: Boolean(v) })}
            />
            SLA breached only
          </label>
        </PopoverContent>
      </Popover>
      {active > 0 && onReset ? (
        <Button variant="ghost" size="sm" className="ml-2 gap-1" onClick={onReset}>
          <X className="size-3.5" /> Clear
        </Button>
      ) : null}
    </div>
  );
}