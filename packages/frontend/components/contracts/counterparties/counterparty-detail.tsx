"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Contract, Counterparty } from "../types";
import { ContractList } from "../library/contract-list";

export function CounterpartyDetail({ counterparty, contracts, onOpenContract }: { counterparty: Counterparty; contracts: Contract[]; onOpenContract?: (c: Contract) => void }) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-lg font-semibold">{counterparty.name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {counterparty.industry ? <span>{counterparty.industry}</span> : null}
          {counterparty.jurisdiction ? <span>{counterparty.jurisdiction}</span> : null}
          {counterparty.registrationNumber ? <span>Reg: {counterparty.registrationNumber}</span> : null}
        </div>
        {counterparty.tags?.length ? <div className="mt-2 flex flex-wrap gap-1">{counterparty.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div> : null}
        {counterparty.notes ? <p className="mt-3 text-sm">{counterparty.notes}</p> : null}
      </Card>
      <section className="space-y-2">
        <h3 className="text-sm font-medium">Contracts ({contracts.length})</h3>
        <ContractList contracts={contracts} onOpen={onOpenContract} />
      </section>
    </div>
  );
}
