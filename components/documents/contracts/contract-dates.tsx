"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export interface ContractDatesProps { effectiveAt?: string; expiresAt?: string; renewalAt?: string; }
export function ContractDates({ effectiveAt, expiresAt, renewalAt }: ContractDatesProps) {
  const rows = [
    { label: "Effective", value: effectiveAt },
    { label: "Renewal", value: renewalAt },
    { label: "Expires", value: expiresAt },
  ].filter((r) => r.value);
  if (!rows.length) return <p className="text-sm text-muted-foreground">No dates recorded.</p>;
  return (
    <Card className="p-3">
      <dl className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm"><dt className="text-muted-foreground">{r.label}</dt><dd>{new Date(r.value!).toLocaleDateString()}</dd></div>
        ))}
      </dl>
    </Card>
  );
}
