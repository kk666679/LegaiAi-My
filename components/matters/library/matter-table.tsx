// components/matters/library/matter-table.tsx
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Matter, MatterSort, MatterSortKey } from "../types";
import { MatterStatusIndicator } from "../status/matter-status-indicator";

export interface MatterTableProps {
  matters: Matter[];
  sort?: MatterSort;
  onSortChange?: (key: MatterSortKey) => void;
  onOpen?: (matter: Matter) => void;
}

export function MatterTable({ matters, sort, onSortChange, onOpen }: MatterTableProps) {
  const columns: Array<{ key: MatterSortKey | "client" | "actions"; label: string }> = [
    { key: "matterNumber", label: "Matter" },
    { key: "name", label: "Name" },
    { key: "client", label: "Client" },
    { key: "status", label: "Status" },
    { key: "nextDeadline", label: "Next deadline" },
    { key: "updatedAt", label: "Updated" },
    { key: "actions", label: "" },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => {
            const sortable = col.key !== "client" && col.key !== "actions";
            const isActive = sort?.key === col.key;
            return (
              <TableHead
                key={col.key}
                aria-sort={
                  isActive
                    ? sort?.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {sortable ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => onSortChange?.(col.key as MatterSortKey)}
                  >
                    {col.label}
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {matters.map((m) => (
          <TableRow key={m.id} className="cursor-pointer" onClick={() => onOpen?.(m)}>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {m.matterNumber}
            </TableCell>
            <TableCell className="max-w-[240px] truncate font-medium">{m.name}</TableCell>
            <TableCell className="text-muted-foreground">{m.clientName ?? "—"}</TableCell>
            <TableCell>
              <MatterStatusIndicator status={m.status} compact />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {m.nextDeadlineAt ? new Date(m.nextDeadlineAt).toLocaleDateString() : "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(m.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
