"use client";
import * as React from "react";
import type { Counterparty } from "../types";
import { CounterpartyCard } from "./counterparty-card";

export function CounterpartyList({ counterparties, onSelect }: { counterparties: Counterparty[]; onSelect?: (c: Counterparty) => void }) {
  if (!counterparties.length) return <p className="text-sm text-muted-foreground">No counterparties yet.</p>;
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{counterparties.map((c) => <CounterpartyCard key={c.id} counterparty={c} onSelect={onSelect} />)}</div>;
}
