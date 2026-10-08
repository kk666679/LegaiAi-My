"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { Contract, Counterparty } from "../types";

export function CounterpartyInsights({ counterparty, contracts }: { counterparty: Counterparty; contracts: Contract[] }) {
  const totalValue = contracts.reduce((s, c) => s + (c.value ?? 0), 0);
  const activeCount = contracts.filter((c) => c.status === "active").length;
  const expiringCount = contracts.filter((c) => c.status === "expiring").length;
  return (
    <Card className="p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Counterparty insights</p>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Total contracts</dt><dd className="tabular-nums">{contracts.length}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Active</dt><dd className="tabular-nums">{activeCount}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Expiring</dt><dd className="tabular-nums">{expiringCount}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Total value</dt><dd className="tabular-nums">{counterparty.currency ?? "RM"} {totalValue.toLocaleString()}</dd></div>
      </dl>
    </Card>
  );
}
