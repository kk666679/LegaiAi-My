"use client";
// app/lawmate/research/_components/research-scope-selector.tsx
import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AuthorityJurisdiction, AuthorityKind, ResearchScope } from "./types";
import { AUTHORITY_KIND_LABELS } from "./types";

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

const JURISDICTIONS: AuthorityJurisdiction[] = ["MY", "SG", "UK", "AU", "HK"];

export interface ResearchScopeSelectorProps {
  scope: ResearchScope;
  onChange: (scope: ResearchScope) => void;
  className?: string;
}

export function ResearchScopeSelector({ scope, onChange, className }: ResearchScopeSelectorProps) {
  const activeCount =
    scope.jurisdictions.length +
    (scope.kinds.length === KINDS.length ? 0 : scope.kinds.length) +
    (scope.dateFrom ? 1 : 0) +
    (scope.dateTo ? 1 : 0);

  const toggleKind = (k: AuthorityKind) => {
    const has = scope.kinds.includes(k);
    const next = has ? scope.kinds.filter((x) => x !== k) : [...scope.kinds, k];
    onChange({ ...scope, kinds: next });
  };

  const toggleJurisdiction = (j: AuthorityJurisdiction) => {
    const has = scope.jurisdictions.includes(j);
    const next = has ? scope.jurisdictions.filter((x) => x !== j) : [...scope.jurisdictions, j];
    onChange({ ...scope, jurisdictions: next.length ? next : ["MY"] });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Quick jurisdiction pills */}
      {JURISDICTIONS.slice(0, 3).map((j) => {
        const active = scope.jurisdictions.includes(j);
        return (
          <button
            key={j}
            type="button"
            onClick={() => toggleJurisdiction(j)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              active
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:border-primary/40",
            )}
          >
            {j}
          </button>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]">
            <Filter className="size-3.5" />
            Scope
            {activeCount > 0 ? (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
                {activeCount}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Jurisdictions</p>
            <div className="space-y-1.5">
              {JURISDICTIONS.map((j) => {
                const checked = scope.jurisdictions.includes(j);
                return (
                  <label key={j} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox checked={checked} onCheckedChange={() => toggleJurisdiction(j)} />
                    {j}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Source types</p>
            <div className="space-y-1.5">
              {KINDS.map((k) => {
                const checked = scope.kinds.includes(k);
                return (
                  <label key={k} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox checked={checked} onCheckedChange={() => toggleKind(k)} />
                    {AUTHORITY_KIND_LABELS[k]}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Date range</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="scope-from" className="text-[11px]">From</Label>
                <Input
                  id="scope-from"
                  type="date"
                  value={scope.dateFrom ?? ""}
                  onChange={(e) => onChange({ ...scope, dateFrom: e.target.value || undefined })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="scope-to" className="text-[11px]">To</Label>
                <Input
                  id="scope-to"
                  type="date"
                  value={scope.dateTo ?? ""}
                  onChange={(e) => onChange({ ...scope, dateTo: e.target.value || undefined })}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={scope.includeSecondary}
              onCheckedChange={(v) => onChange({ ...scope, includeSecondary: Boolean(v) })}
            />
            Include secondary sources (commentary, textbooks)
          </label>
        </PopoverContent>
      </Popover>

      {scope.jurisdictions.length > 1 || scope.kinds.length < KINDS.length ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          onClick={() =>
            onChange({
              jurisdictions: ["MY"],
              kinds: KINDS,
              includeSecondary: false,
            })
          }
        >
          <X className="size-3" /> Reset scope
        </Button>
      ) : null}
    </div>
  );
}
