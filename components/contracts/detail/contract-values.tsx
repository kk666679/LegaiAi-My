"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { ContractValue } from "../types";

export function ContractDetailValues({ values }: { values: ContractValue[] }) {
  if (!values.length) return <p className="text-sm text-muted-foreground">No values extracted.</p>;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {values.map((v) => (
        <Card key={v.id} className="p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{v.label}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{v.currency ?? "RM"} {v.amount.toLocaleString()}</p>
          <p className="text-[10px] capitalize text-muted-foreground">{v.kind.replace("-", " ")}</p>
        </Card>
      ))}
    </div>
  );
}
