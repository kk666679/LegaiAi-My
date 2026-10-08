// components/matters/parties/matter-parties.tsx
"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatterParty, MatterPartyRole } from "../types";
import { PartyCard } from "./party-card";

export interface MatterPartiesProps {
  parties: MatterParty[];
  onAdd?: () => void;
  onSelect?: (party: MatterParty) => void;
}

const GROUP_ORDER: MatterPartyRole[] = [
  "client",
  "co-client",
  "opposing-party",
  "opposing-counsel",
  "witness",
  "expert",
  "third-party",
  "court",
  "regulator",
];

const GROUP_LABELS: Record<MatterPartyRole, string> = {
  client: "Client",
  "co-client": "Co-client",
  "opposing-party": "Opposing party",
  "opposing-counsel": "Opposing counsel",
  witness: "Witnesses",
  expert: "Experts",
  "third-party": "Third parties",
  court: "Court",
  regulator: "Regulator",
};

export function MatterParties({ parties, onAdd, onSelect }: MatterPartiesProps) {
  const groups = new Map<MatterPartyRole, MatterParty[]>();
  for (const p of parties) {
    if (!groups.has(p.role)) groups.set(p.role, []);
    groups.get(p.role)!.push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{parties.length} parties on this matter</p>
        {onAdd ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAdd}>
            <Plus className="size-3.5" /> Add party
          </Button>
        ) : null}
      </div>

      {parties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No parties yet.</p>
      ) : (
        GROUP_ORDER.filter((r) => groups.has(r)).map((role) => (
          <section key={role} aria-labelledby={`party-${role}`} className="space-y-2">
            <h3 id={`party-${role}`} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {GROUP_LABELS[role]}
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {groups.get(role)!.map((p) => (
                <PartyCard key={p.id} party={p} onSelect={onSelect} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
