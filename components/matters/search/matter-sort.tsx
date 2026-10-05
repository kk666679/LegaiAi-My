// components/matters/search/matter-sort.tsx
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MatterSort, MatterSortKey, MatterSortDirection } from "../types";

export interface MatterSortSelectProps {
  value: MatterSort;
  onChange: (value: MatterSort) => void;
}

const OPTIONS: Array<{ key: MatterSortKey; label: string }> = [
  { key: "updatedAt", label: "Recently updated" },
  { key: "openedAt", label: "Recently opened" },
  { key: "matterNumber", label: "Matter number" },
  { key: "name", label: "Name" },
  { key: "nextDeadline", label: "Next deadline" },
  { key: "status", label: "Status" },
];

export function MatterSortSelect({ value, onChange }: MatterSortSelectProps) {
  const serialized = `${value.key}:${value.direction}`;
  return (
    <Select
      value={serialized}
      onValueChange={(v) => {
        const [key, direction] = v.split(":") as [MatterSortKey, MatterSortDirection];
        onChange({ key, direction });
      }}
    >
      <SelectTrigger className="w-[190px]" aria-label="Sort matters">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.flatMap((o) => [
          <SelectItem key={`${o.key}:desc`} value={`${o.key}:desc`}>
            {o.label} (newest)
          </SelectItem>,
          <SelectItem key={`${o.key}:asc`} value={`${o.key}:asc`}>
            {o.label} (oldest)
          </SelectItem>,
        ])}
      </SelectContent>
    </Select>
  );
}
