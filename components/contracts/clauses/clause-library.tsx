"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClauseCategory, ContractClause } from "../types";
import { CLAUSE_CATEGORIES, CLAUSE_CATEGORY_LABELS } from "./clause-categories";
import { ClauseCard } from "./clause-card";

export interface ClauseLibraryProps {
  clauses: ContractClause[];
  onSelect?: (c: ContractClause) => void;
  onInsert?: (c: ContractClause) => void;
}

export function ClauseLibrary({ clauses, onSelect, onInsert }: ClauseLibraryProps) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<ClauseCategory | "all">("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return clauses.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (!q) return true;
      return `${c.heading} ${c.body}`.toLowerCase().includes(q);
    });
  }, [clauses, query, category]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clauses" className="pl-9" aria-label="Search clauses" />
      </div>
      <ScrollArea className="w-full">
        <div className="flex flex-wrap gap-1.5 pb-2">
          <Badge variant={category === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setCategory("all")}>All</Badge>
          {CLAUSE_CATEGORIES.map((c) => (
            <Badge key={c} variant={category === c ? "default" : "outline"} className="cursor-pointer" onClick={() => setCategory(c)}>
              {CLAUSE_CATEGORY_LABELS[c]}
            </Badge>
          ))}
        </div>
      </ScrollArea>
      {filtered.length === 0 ? <Card className="p-6 text-center text-sm text-muted-foreground">No clauses match.</Card> : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} onClick={() => onInsert?.(c)}>
              <ClauseCard clause={c} onSelect={onSelect} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
