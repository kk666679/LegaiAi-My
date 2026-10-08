"use client";
import * as React from "react";
import type { ContractStats, Contract } from "../types";
import { ContractsKpis } from "./contracts-kpis";
import { ContractList } from "../library/contract-list";

export interface ContractsAnalyticsProps {
  stats: ContractStats;
  topRisky: Contract[];
  expiringSoon: Contract[];
  onOpenContract?: (c: Contract) => void;
}

export function ContractsAnalytics({ stats, topRisky, expiringSoon, onOpenContract }: ContractsAnalyticsProps) {
  return (
    <div className="space-y-4">
      <ContractsKpis total={stats.total} active={stats.active} totalValue={stats.totalValue} currency={stats.currency} avgCycleDays={0} criticalRisks={stats.criticalRisks} overdueObligations={stats.overdueObligations} deviationRate={0} />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2"><h3 className="text-sm font-medium">Highest risk</h3><ContractList contracts={topRisky} onOpen={onOpenContract} /></section>
        <section className="space-y-2"><h3 className="text-sm font-medium">Expiring soon</h3><ContractList contracts={expiringSoon} onOpen={onOpenContract} /></section>
      </div>
    </div>
  );
}
