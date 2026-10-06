"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RenewalAlert } from "../types";

export function RenewalCalendar({ alerts }: { alerts: RenewalAlert[] }) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, RenewalAlert[]>();
    for (const a of alerts) {
      const key = a.triggerAt.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [alerts]);

  if (grouped.length === 0) return <p className="text-sm text-muted-foreground">No renewals scheduled.</p>;

  return (
    <div className="space-y-3">
      {grouped.map(([month, items]) => (
        <Card key={month} className="p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{new Date(`${month}-01`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
          <ul className="space-y-1.5">
            {items.map((a) => {
              const d = new Date(a.triggerAt).getDate();
              const urgent = new Date(a.triggerAt).getTime() - Date.now() < 14 * 86_400_000;
              return (
                <li key={a.id} className="flex items-center gap-3">
                  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium", urgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>{d}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{a.contractName}</span>
                  <span className="text-[11px] capitalize text-muted-foreground">{a.type.replace("-", " ")}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
