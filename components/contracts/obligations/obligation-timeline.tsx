"use client";
import * as React from "react";
import type { ContractObligation } from "../types";

export function ObligationTimeline({ obligations }: { obligations: ContractObligation[] }) {
  const sorted = obligations.filter((o) => o.dueAt || o.nextDueAt).sort((a, b) => new Date(a.nextDueAt ?? a.dueAt!).getTime() - new Date(b.nextDueAt ?? b.dueAt!).getTime());
  return (
    <ol className="relative space-y-4 border-l border-border/60 pl-4">
      {sorted.map((o) => {
        const due = new Date(o.nextDueAt ?? o.dueAt!);
        const overdue = !["met", "waived"].includes(o.status) && due.getTime() < Date.now();
        return (
          <li key={o.id} className="relative">
            <span className={overdue ? "absolute -left-[22px] top-1.5 size-2 rounded-full bg-destructive" : "absolute -left-[22px] top-1.5 size-2 rounded-full bg-primary"} />
            <p className="text-sm">{o.description}</p>
            <p className="text-xs text-muted-foreground">{o.partyName} · {due.toLocaleDateString()} · <span className="capitalize">{o.status}</span></p>
          </li>
        );
      })}
    </ol>
  );
}
