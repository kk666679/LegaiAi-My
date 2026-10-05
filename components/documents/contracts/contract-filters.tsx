"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUSES = ["draft", "negotiation", "active", "expiring", "expired", "terminated"];
export function ContractFilters({ value, onChange }: { value: { q?: string; status?: string[] }; onChange?: (v: { q?: string; status?: string[] }) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={value.q ?? ""} onChange={(e) => onChange?.({ ...value, q: e.target.value })} placeholder="Search contracts" className="h-8 w-56 text-sm" aria-label="Search contracts" />
      {STATUSES.map((s) => {
        const active = value.status?.includes(s);
        return (
          <Button key={s} size="sm" variant={active ? "secondary" : "outline"} className="h-7 text-[11px] capitalize"
            onClick={() => { const next = new Set(value.status ?? []); next.has(s) ? next.delete(s) : next.add(s); onChange?.({ ...value, status: [...next] }); }}>{s}</Button>
        );
      })}
    </div>
  );
}
