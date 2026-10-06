"use client";
import * as React from "react";
import type { Contract, ContractStats, RenewalAlert } from "../types";
import { ContractsStats } from "./contracts-stats";
import { ContractsQuickActions } from "./contracts-quick-actions";
import { ContractList } from "../library/contract-list";

export interface ContractsOverviewProps {
  stats: ContractStats;
  recent: Contract[];
  expiring: RenewalAlert[];
  onNew?: () => void;
  onUpload?: () => void;
  onTemplates?: () => void;
  onPlaybooks?: () => void;
  onClauseLibrary?: () => void;
  onRunAnalysis?: () => void;
  onRenewals?: () => void;
  onOpenContract?: (c: Contract) => void;
  onViewAll?: () => void;
}

export function ContractsOverview({ stats, recent, expiring, onNew, onUpload, onTemplates, onPlaybooks, onClauseLibrary, onRunAnalysis, onRenewals, onOpenContract, onViewAll }: ContractsOverviewProps) {
  return (
    <div className="space-y-6 p-4 lg:p-6">
      <ContractsStats stats={stats} />
      <ContractsQuickActions onNew={onNew} onUpload={onUpload} onTemplates={onTemplates} onPlaybooks={onPlaybooks} onClauseLibrary={onClauseLibrary} onRunAnalysis={onRunAnalysis} onRenewals={onRenewals} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent contracts</h2>
            {onViewAll ? <button type="button" onClick={onViewAll} className="text-xs text-primary hover:underline">View all</button> : null}
          </div>
          <ContractList contracts={recent.slice(0, 6)} onOpen={onOpenContract} />
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Upcoming renewals</h2>
          {expiring.length === 0 ? <p className="text-xs text-muted-foreground">No upcoming renewals.</p> : (
            <ul className="space-y-2">
              {expiring.slice(0, 6).map((r) => (
                <li key={r.id} className="rounded-md border border-border/60 bg-card p-2.5">
                  <p className="truncate text-sm font-medium">{r.contractName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.triggerAt).toLocaleDateString()}{r.noticeDays ? ` · ${r.noticeDays}d notice` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
