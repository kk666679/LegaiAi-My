"use client";
import * as React from "react";
import { Calendar, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContractObligation } from "../types";
import { ObligationStatusIndicator } from "./obligation-status-indicator";

export function ObligationCard({ obligation, onSelect }: { obligation: ContractObligation; onSelect?: (o: ContractObligation) => void }) {
  const overdue = obligation.status === "overdue";
  return (
    <Card role="button" tabIndex={0} onClick={() => onSelect?.(obligation)} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(obligation); }}
      className={cn("cursor-pointer p-3 transition-colors hover:border-primary/40", overdue && "border-destructive/40 bg-destructive/5")}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium">{obligation.description}</p>
        <ObligationStatusIndicator status={obligation.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><User className="size-3" />{obligation.partyName}</span>
        {obligation.nextDueAt || obligation.dueAt ? <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{new Date(obligation.nextDueAt ?? obligation.dueAt!).toLocaleDateString()}</span> : null}
        {obligation.frequency ? <span className="capitalize">{obligation.frequency}</span> : null}
        {obligation.amount ? <span className="tabular-nums">{obligation.currency ?? "RM"} {obligation.amount.toLocaleString()}</span> : null}
      </div>
    </Card>
  );
}
