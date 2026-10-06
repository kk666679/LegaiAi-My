"use client";
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Contract, ContractSort, ContractSortKey } from "../types";
import { ContractStatusIndicator } from "../status/contract-status-indicator";

export function ContractTable({ contracts, sort, onSortChange, onOpen }: { contracts: Contract[]; sort?: ContractSort; onSortChange?: (k: ContractSortKey) => void; onOpen?: (c: Contract) => void }) {
  const columns: Array<{ key: ContractSortKey | "counterparty" | "actions"; label: string }> = [
    { key: "name", label: "Contract" }, { key: "counterparty", label: "Counterparty" }, { key: "status", label: "Status" },
    { key: "value", label: "Value" }, { key: "expiresAt", label: "Expires" }, { key: "updatedAt", label: "Updated" }, { key: "actions", label: "" },
  ];
  return (
    <Table>
      <TableHeader><TableRow>{columns.map((col) => {
        const sortable = !["counterparty", "actions"].includes(col.key);
        const active = sort?.key === col.key;
        return <TableHead key={col.key} aria-sort={active ? (sort?.direction === "asc" ? "ascending" : "descending") : undefined}>
          {sortable ? <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSortChange?.(col.key as ContractSortKey)}>{col.label}</button> : col.label}
        </TableHead>;
      })}</TableRow></TableHeader>
      <TableBody>
        {contracts.map((c) => (
          <TableRow key={c.id} className="cursor-pointer" onClick={() => onOpen?.(c)}>
            <TableCell className="max-w-[260px] truncate font-medium">{c.name}</TableCell>
            <TableCell className="text-muted-foreground">{c.counterpartyName ?? "—"}</TableCell>
            <TableCell><ContractStatusIndicator status={c.status} compact /></TableCell>
            <TableCell className="tabular-nums text-muted-foreground">{c.value ? `${c.currency ?? "RM"} ${c.value.toLocaleString()}` : "—"}</TableCell>
            <TableCell className="text-muted-foreground">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(c.updatedAt).toLocaleDateString()}</TableCell>
            <TableCell />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
