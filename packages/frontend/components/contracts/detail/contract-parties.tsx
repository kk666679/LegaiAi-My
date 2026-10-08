"use client";
import * as React from "react";
import { Building2, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContractParty } from "../types";

export function ContractDetailParties({ parties }: { parties: ContractParty[] }) {
  if (!parties.length) return <p className="text-sm text-muted-foreground">No parties recorded.</p>;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {parties.map((p) => {
        const Icon = p.entityType === "company" || p.entityType === "government" || p.entityType === "partnership" ? Building2 : User;
        return (
          <Card key={p.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-muted p-2 text-muted-foreground"><Icon className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate text-sm font-medium">{p.name}</p><Badge variant="secondary" className="text-[10px] capitalize">{p.role.replace("-", " ")}</Badge></div>
                {p.registrationNumber ? <p className="text-xs text-muted-foreground">Reg: {p.registrationNumber}</p> : null}
                {p.signatory ? <p className="text-xs text-muted-foreground">Signatory: {p.signatory}{p.signatoryTitle ? ` (${p.signatoryTitle})` : ""}</p> : null}
                {p.contactEmail ? <p className="text-xs text-muted-foreground">{p.contactEmail}</p> : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
