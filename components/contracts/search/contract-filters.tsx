"use client";
import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { ContractFilters, ContractStatus, ContractType, RiskSeverity } from "../types";

const STATUSES: ContractStatus[] = ["draft", "in-negotiation", "pending-approval", "executed", "active", "expiring", "expired", "terminated", "renewed", "archived"];
const TYPES: ContractType[] = ["employment", "services", "nda", "lease", "license", "supply", "partnership", "loan", "settlement", "mou", "other"];
const RISKS: RiskSeverity[] = ["low", "medium", "high", "critical"];

export function ContractFiltersBar({ filters, onFiltersChange, onReset, className }: { filters: ContractFilters; onFiltersChange: (next: Partial<ContractFilters>) => void; onReset?: () => void; className?: string }) {
  const activeCount = (filters.status?.length ?? 0) + (filters.type?.length ?? 0) + (filters.riskSeverity?.length ?? 0) + (filters.hasDeviations ? 1 : 0);
  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5"><Filter className="size-4" />Filters{activeCount > 0 ? <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{activeCount}</Badge> : null}</Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <div className="space-y-1.5">{STATUSES.map((s) => {
              const checked = filters.status?.includes(s) ?? false;
              return <label key={s} className="flex cursor-pointer items-center gap-2 text-sm capitalize"><Checkbox checked={checked} onCheckedChange={(v) => { const n = new Set(filters.status ?? []); v ? n.add(s) : n.delete(s); onFiltersChange({ status: [...n] }); }} />{s.replace("-", " ")}</label>;
            })}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</p>
            <div className="space-y-1.5">{TYPES.map((t) => {
              const checked = filters.type?.includes(t) ?? false;
              return <label key={t} className="flex cursor-pointer items-center gap-2 text-sm capitalize"><Checkbox checked={checked} onCheckedChange={(v) => { const n = new Set(filters.type ?? []); v ? n.add(t) : n.delete(t); onFiltersChange({ type: [...n] }); }} />{t.replace("-", " ")}</label>;
            })}</div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Risk severity</p>
            <div className="space-y-1.5">{RISKS.map((r) => {
              const checked = filters.riskSeverity?.includes(r) ?? false;
              return <label key={r} className="flex cursor-pointer items-center gap-2 text-sm capitalize"><Checkbox checked={checked} onCheckedChange={(v) => { const n = new Set(filters.riskSeverity ?? []); v ? n.add(r) : n.delete(r); onFiltersChange({ riskSeverity: [...n] }); }} />{r}</label>;
            })}</div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={Boolean(filters.hasDeviations)} onCheckedChange={(v) => onFiltersChange({ hasDeviations: Boolean(v) })} />
            Playbook deviations only
          </label>
        </PopoverContent>
      </Popover>
      {activeCount > 0 && onReset ? <Button variant="ghost" size="sm" className="ml-2 gap-1" onClick={onReset}><X className="size-3.5" />Clear</Button> : null}
    </div>
  );
}
