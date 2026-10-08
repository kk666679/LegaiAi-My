"use client";
// app/lawmate/research/_components/research-results-header.tsx
import * as React from "react";
import { ArrowDownAZ, Calendar, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResearchStatusBadge } from "./authority-badges";
import type { ResearchSession, ResearchSort, ResearchSortKey } from "./types";

const SORTS: Array<{ key: ResearchSortKey; label: string }> = [
  { key: "relevance", label: "Relevance" },
  { key: "confidence", label: "Confidence" },
  { key: "year", label: "Year" },
  { key: "court", label: "Court level" },
];

export function ResearchResultsHeader({
  session,
  sort,
  onSortChange,
  actions,
}: {
  session: ResearchSession;
  sort: ResearchSort;
  onSortChange: (s: ResearchSort) => void;
  actions?: React.ReactNode;
}) {
  const activeSort = SORTS.find((s) => s.key === sort.key) ?? SORTS[0];
  const activeLabel = activeSort ? activeSort.label : (SORTS[0]?.label ?? "Sort");
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ResearchStatusBadge status={session.status} compact />
            <span className="text-[11px] text-muted-foreground">
              {session.durationMs ? `${(session.durationMs / 1000).toFixed(1)}s` : ""}
              {session.avgConfidence ? ` · avg confidence ${Math.round(session.avgConfidence * 100)}%` : ""}
            </span>
          </div>
          <h1 className="mt-1 truncate text-lg font-semibold">{session.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{session.query.text}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowDownAZ className="size-3.5" />
              {activeLabel}
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORTS.map((s) => (
              <DropdownMenuItem
                key={s.key}
                onSelect={() => onSortChange({ key: s.key, direction: s.key === "year" ? "desc" : "desc" })}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => onSortChange({ key: "year", direction: sort.direction === "desc" ? "asc" : "desc" })}
        >
          <Calendar className="size-3.5" />
          {sort.direction === "desc" ? "Newest first" : "Oldest first"}
        </Button>

        <span className="ml-auto text-[11px] text-muted-foreground">
          <Sparkles className="mr-1 inline size-3" />
          Ranked by AI relevance
        </span>
      </div>
    </header>
  );
}
