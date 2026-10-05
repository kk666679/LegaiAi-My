// components/documents/search/document-sort.tsx
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocumentSort, DocumentSortKey, SortDirection } from "../types";

export interface DocumentSortProps {
  value: DocumentSort;
  onChange: (value: DocumentSort) => void;
}

const OPTIONS: Array<{ key: DocumentSortKey; label: string }> = [
  { key: "updatedAt", label: "Recently updated" },
  { key: "createdAt", label: "Recently created" },
  { key: "name", label: "Name" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
];

export function DocumentSortSelect({ value, onChange }: DocumentSortProps) {
  const serialized = `${value.key}:${value.direction}`;

  return (
    <Select
      value={serialized}
      onValueChange={(v) => {
        const [key, direction] = v.split(":") as [DocumentSortKey, SortDirection];
        onChange({ key, direction });
      }}
    >
      <SelectTrigger className="w-[180px]" aria-label="Sort documents">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.flatMap((opt) => [
          <SelectItem key={`${opt.key}:desc`} value={`${opt.key}:desc`}>
            {opt.label} (newest)
          </SelectItem>,
          <SelectItem key={`${opt.key}:asc`} value={`${opt.key}:asc`}>
            {opt.label} (oldest)
          </SelectItem>,
        ])}
      </SelectContent>
    </Select>
  );
}
