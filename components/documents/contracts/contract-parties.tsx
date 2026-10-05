"use client";
import * as React from "react";
import type { DocumentParty } from "../types";
import { Card } from "@/components/ui/card";

export function ContractParties({ parties = [] }: { parties?: DocumentParty[] }) {
  if (!parties.length) return <p className="text-sm text-muted-foreground">No parties recorded.</p>;
  return (
    <ul className="space-y-2">
      {parties.map((p) => (
        <li key={p.id}><Card className="p-3">
          <p className="text-sm font-medium">{p.name}</p>
          {p.role ? <p className="text-xs text-muted-foreground">{p.role}</p> : null}
        </Card></li>
      ))}
    </ul>
  );
}
