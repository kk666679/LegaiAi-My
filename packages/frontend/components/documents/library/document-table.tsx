// components/documents/library/document-table.tsx
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
import type { LegalDocument, DocumentSort, DocumentSortKey } from "../types";
import { DocumentStatusIndicator } from "../status/document-status-indicator";

export interface DocumentTableProps {
  documents: LegalDocument[];
  sort?: DocumentSort;
  onSortChange?: (key: DocumentSortKey) => void;
  onOpen?: (doc: LegalDocument) => void;
}

export function DocumentTable({
  documents,
  sort,
  onSortChange,
  onOpen,
}: DocumentTableProps) {
  const columns: Array<{ key: DocumentSortKey | "owner" | "actions"; label: string }> = [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "owner", label: "Owner" },
    { key: "updatedAt", label: "Updated" },
    { key: "actions", label: "" },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => {
            const sortable = col.key !== "owner" && col.key !== "actions";
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
                    onClick={() => onSortChange?.(col.key as DocumentSortKey)}
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
        {documents.map((doc) => (
          <TableRow
            key={doc.id}
            className="cursor-pointer"
            onClick={() => onOpen?.(doc)}
          >
            <TableCell className="max-w-[280px] truncate font-medium">
              {doc.name}
            </TableCell>
            <TableCell className="text-muted-foreground">{doc.type}</TableCell>
            <TableCell>
              <DocumentStatusIndicator status={doc.status} compact />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {doc.ownerName ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(doc.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
