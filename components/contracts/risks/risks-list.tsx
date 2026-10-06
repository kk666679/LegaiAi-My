"use client";
import * as React from "react";
import type { ContractRisk } from "../types";
import { RiskCard } from "./risk-card";

export function RisksList({ risks, onSelect }: { risks: ContractRisk[]; onSelect?: (r: ContractRisk) => void }) {
  if (!risks.length) return <p className="text-sm text-muted-foreground">No risks identified.</p>;
  const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const sorted = [...risks].sort((a, b) => order[a.severity] - order[b.severity]);
  return <div className="space-y-2">{sorted.map((r) => <RiskCard key={r.id} risk={r} onSelect={onSelect} />)}</div>;
}
