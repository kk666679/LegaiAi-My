"use client";
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LegalDocument } from "../types";
import { ContractStatus } from "./contract-status";

export function ContractTable({ contracts, onOpen }: { contracts: LegalDocument[]; onOpen?: (d: LegalDocument) => void }) {
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead>Contract</TableHead><TableHead>Parties</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {contracts.map((c) => (
          <TableRow key={c.id} className="cursor-pointer" onClick={() => onOpen?.(c)}>
            <TableCell className="max-w-[280px] truncate font-medium">{c.name}</TableCell>
            <TableCell className="max-w-[280px] truncate text-muted-foreground">{c.parties?.map((p) => p.name).join(", ") ?? "—"}</TableCell>
            <TableCell><ContractStatus status={c.status} /></TableCell>
            <TableCell className="text-muted-foreground">{new Date(c.updatedAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
