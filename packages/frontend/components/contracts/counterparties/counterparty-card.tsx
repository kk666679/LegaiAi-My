"use client";
import * as React from "react";
import { Building2, Mail, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Counterparty } from "../types";

const TIER_TONE: Record<string, string> = {
  strategic: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  key: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  standard: "bg-muted text-muted-foreground",
  watchlist: "bg-destructive/10 text-destructive",
};

export function CounterpartyCard({ counterparty, onSelect }: { counterparty: Counterparty; onSelect?: (c: Counterparty) => void }) {
  return (
    <Card role="button" tabIndex={0} onClick={() => onSelect?.(counterparty)} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(counterparty); }}
      className="cursor-pointer p-3 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground"><Building2 className="size-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{counterparty.name}</p>
            {counterparty.tier ? <Badge variant="outline" className={cn("border-transparent text-[10px] capitalize", TIER_TONE[counterparty.tier])}>{counterparty.tier}</Badge> : null}
          </div>
          {counterparty.industry ? <p className="text-xs text-muted-foreground">{counterparty.industry}{counterparty.jurisdiction ? ` · ${counterparty.jurisdiction}` : ""}</p> : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {counterparty.contractCount != null ? <span>{counterparty.contractCount} contracts</span> : null}
            {counterparty.totalValue != null ? <span className="tabular-nums">{counterparty.currency ?? "RM"} {counterparty.totalValue.toLocaleString()}</span> : null}
            {counterparty.riskRating ? <span className={cn("capitalize", counterparty.riskRating === "high" || counterparty.riskRating === "critical" ? "text-destructive" : "")}><ShieldAlert className="inline size-3" /> {counterparty.riskRating} risk</span> : null}
          </div>
          {counterparty.primaryEmail ? <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Mail className="size-3" />{counterparty.primaryEmail}</p> : null}
        </div>
      </div>
    </Card>
  );
}
