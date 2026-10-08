"use client";
import * as React from "react";
import type { ContractClause } from "../types";
import { ClauseCard } from "./clause-card";

export function ClauseList({ clauses, onSelect }: { clauses: ContractClause[]; onSelect?: (c: ContractClause) => void }) {
  if (!clauses.length) return <p className="text-sm text-muted-foreground">No clauses extracted yet.</p>;
  return <div className="space-y-2">{clauses.map((c) => <ClauseCard key={c.id} clause={c} onSelect={onSelect} />)}</div>;
}
