"use client";
import * as React from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContractsProvider,
  ContractsOverview,
  ContractLibrary,
  ContractSearch,
  ContractsHeader,
  ContractsShell,
  type Contract,
  type ContractFilters,
  type ContractViewMode,
  type ContractSort,
} from "@/components/contracts";

export function ContractsListClient() {
  const [contracts] = React.useState<Contract[]>([]);
  const [filters, setFilters] = React.useState<ContractFilters>({});
  const [sort, setSort] = React.useState<ContractSort>({ key: "updatedAt", direction: "desc" });
  const [view, setView] = React.useState<ContractViewMode>("grid");

  const filtered = React.useMemo(() => {
    const q = (filters.query ?? "").toLowerCase();
    return contracts.filter((c) => {
      if (q && !`${c.name} ${c.counterpartyName ?? ""}`.toLowerCase().includes(q)) return false;
      if (filters.status?.length && !filters.status.includes(c.status)) return false;
      if (filters.type?.length && !filters.type.includes(c.type)) return false;
      return true;
    });
  }, [contracts, filters]);

  return (
    <ContractsProvider contracts={contracts} initialFilters={filters} initialSort={sort}>
      <ContractsShell
        header={
          <ContractsHeader
            title="Contracts"
            description="Track contracts from intake through renewal."
            actions={
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5"><Upload className="size-3.5" />Import</Button>
                <Button asChild size="sm" className="gap-1.5"><Link href="/legalai/contracts/new"><Plus className="size-3.5" />New contract</Link></Button>
              </div>
            }
          />
        }
      >
        <div className="space-y-6 p-4 lg:p-6">
          <ContractsOverview
            stats={{ total: contracts.length, active: contracts.filter((c) => c.status === "active").length, inNegotiation: 0, pendingApproval: 0, expiring: 0, overdueObligations: 0, criticalRisks: 0, totalValue: 0, currency: "RM" }}
            recent={contracts}
            expiring={[]}
          />
          <ContractSearch filters={filters} sort={sort} onFiltersChange={(n) => setFilters((f) => ({ ...f, ...n }))} onReset={() => setFilters({})} onSortChange={setSort} />
          <ContractLibrary contracts={filtered} view={view} onViewChange={setView} sort={sort} emptyAction={{ label: "Create contract", onClick: () => { window.location.href = "/legalai/contracts/new"; } }} />
        </div>
      </ContractsShell>
    </ContractsProvider>
  );
}
