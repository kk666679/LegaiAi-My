"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { ContractObligation } from "../types";
import { ObligationsList } from "./obligations-list";
import { ObligationTimeline } from "./obligation-timeline";

export function ObligationTracker({ obligations, onSelect }: { obligations: ContractObligation[]; onSelect?: (o: ContractObligation) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2"><ObligationsList obligations={obligations} onSelect={onSelect} /></div>
      <Card className="p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
        {obligations.some((o) => o.dueAt || o.nextDueAt) ? <ObligationTimeline obligations={obligations} /> : <p className="text-sm text-muted-foreground">No dated obligations.</p>}
      </Card>
    </div>
  );
}
