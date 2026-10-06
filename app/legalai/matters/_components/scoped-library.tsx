"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MattersProvider,
  MattersShell,
  MattersHeader,
  MatterLibrary,
  MatterSearch,
  useMattersList,
  type MatterFilters,
  type MatterSort,
  type MatterViewMode,
} from "@/components/matters";

export interface ScopedLibraryProps {
  title: string;
  description?: string;
  scope: string;
  status?: string[];
}

export function ScopedLibrary({ title, description, scope, status }: ScopedLibraryProps) {
  const router = useRouter();
  const [view, setView] = React.useState<MatterViewMode>("grid");
  const [filters, setFilters] = React.useState<MatterFilters>({ status: status as never });
  const [sort, setSort] = React.useState<MatterSort>({ key: "updatedAt", direction: "desc" });

  const { matters, loading, error } = useMattersList({ filters, sort, scope });

  return (
    <MattersProvider matters={matters} initialFilters={filters} initialSort={sort}>
      <MattersShell header={<MattersHeader title={title} description={description} />}>
        <div className="space-y-3 p-4 lg:p-6">
          <MatterSearch
            filters={filters}
            sort={sort}
            onFiltersChange={(n) => setFilters((f) => ({ ...f, ...n }))}
            onReset={() => setFilters({})}
            onSortChange={setSort}
          />
          <MatterLibrary
            matters={matters}
            loading={loading}
            view={view}
            onViewChange={setView}
            sort={sort}
            onSortChange={(k) => setSort((s) => ({ ...s, key: k }))}
            onOpen={(m) => router.push(`/legalai/matters/${m.id}/overview`)}
          />
        </div>
      </MattersShell>
    </MattersProvider>
  );
}
