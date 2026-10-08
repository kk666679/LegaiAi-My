"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContractRisk } from "../types";

const LIKELIHOODS: ContractRisk["likelihood"][] = ["rare", "unlikely", "possible", "likely", "almost-certain"];
const IMPACTS: ContractRisk["impact"][] = ["negligible", "minor", "moderate", "major", "severe"];

function cellTone(l: number, i: number): string {
  const score = l + i; // 0..8
  if (score >= 6) return "bg-destructive/30";
  if (score >= 4) return "bg-orange-500/25";
  if (score >= 2) return "bg-amber-500/20";
  return "bg-emerald-500/15";
}

export function RiskMatrix({ risks }: { risks: ContractRisk[] }) {
  const grid = new Map<string, ContractRisk[]>();
  for (const r of risks) {
    const key = `${r.likelihood}|${r.impact}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(r);
  }
  return (
    <Card className="overflow-x-auto p-4">
      <div className="inline-block">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-[10px] uppercase text-muted-foreground"></th>
              {IMPACTS.map((i) => <th key={i} className="p-1 text-[10px] uppercase text-muted-foreground">{i}</th>)}
            </tr>
          </thead>
          <tbody>
            {[...LIKELIHOODS].reverse().map((l, lIdx) => (
              <tr key={l}>
                <th className="p-1 text-right text-[10px] uppercase text-muted-foreground">{l}</th>
                {IMPACTS.map((i, iIdx) => {
                  const cell = grid.get(`${l}|${i}`) ?? [];
                  return (
                    <td key={i} className={cn("relative size-14 rounded border border-border/40", cellTone(LIKELIHOODS.length - 1 - lIdx, iIdx))}>
                      {cell.length > 0 ? (
                        <div className="flex size-full items-center justify-center text-xs font-medium">{cell.length}</div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-center text-[10px] uppercase text-muted-foreground">Impact →</p>
      </div>
    </Card>
  );
}
