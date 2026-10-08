"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export interface Obligation { id: string; party: string; description: string; dueAt?: string; }
export function ContractObligations({ obligations }: { obligations: Obligation[] }) {
  if (!obligations.length) return <p className="text-sm text-muted-foreground">No obligations extracted.</p>;
  return (
    <ul className="space-y-2">
      {obligations.map((o) => (
        <li key={o.id}><Card className="flex items-start gap-3 p-3">
          <ListChecks className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm">{o.description}</p>
            <p className="text-xs text-muted-foreground">{o.party}{o.dueAt ? ` · Due ${new Date(o.dueAt).toLocaleDateString()}` : ""}</p>
          </div>
        </Card></li>
      ))}
    </ul>
  );
}
