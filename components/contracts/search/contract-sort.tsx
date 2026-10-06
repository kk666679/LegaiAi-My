"use client";
import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContractSort, ContractSortKey, ContractSortDirection } from "../types";

const OPTIONS: Array<{ key: ContractSortKey; label: string }> = [
  { key: "updatedAt", label: "Recently updated" }, { key: "name", label: "Name" }, { key: "counterparty", label: "Counterparty" },
  { key: "status", label: "Status" }, { key: "value", label: "Value" }, { key: "expiresAt", label: "Expiry" }, { key: "risk", label: "Risk" },
];

export function ContractSortSelect({ value, onChange }: { value: ContractSort; onChange: (v: ContractSort) => void }) {
  const serialized = `${value.key}:${value.direction}`;
  return (
    <Select value={serialized} onValueChange={(v) => { const [key, direction] = v.split(":") as [ContractSortKey, ContractSortDirection]; onChange({ key, direction }); }}>
      <SelectTrigger className="w-[200px]" aria-label="Sort contracts"><SelectValue /></SelectTrigger>
      <SelectContent>{OPTIONS.flatMap((o) => [
        <SelectItem key={`${o.key}:desc`} value={`${o.key}:desc`}>{o.label} (newest)</SelectItem>,
        <SelectItem key={`${o.key}:asc`} value={`${o.key}:asc`}>{o.label} (oldest)</SelectItem>,
      ])}</SelectContent>
    </Select>
  );
}
