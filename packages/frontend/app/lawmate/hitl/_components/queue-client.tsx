"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  HITLProvider,
  HITLHeader,
  HITLShell,
  HITLQueue,
  HITLQueueSearch,
  HITLQueueFilters,
  HITLSLAAlerts,
  HITLStatsCards,
  useHITLQueue,
  type HITLRequest,
  type HITLFilters,
  type HITLSort,
  type HITLViewMode,
  type HITLActor,
} from "@/components/hitl";

export interface QueueClientProps {
  title: string;
  description?: string;
  scope: "inbox" | "assigned" | "team" | "escalations" | "history" | "all";
  currentUser?: HITLActor;
}

export function QueueClient({ title, description, scope, currentUser }: QueueClientProps) {
  const router = useRouter();
  const [view, setView] = React.useState<HITLViewMode>("list");
  const [filters, setFilters] = React.useState<HITLFilters>({});
  const [sort, setSort] = React.useState<HITLSort>({ key: "priority", direction: "desc" });

  const user = currentUser ?? { id: "u-1", name: "You" };
  const { requests, stats, loading, error } = useHITLQueue({ filters, sort, scope });
  const scopeNotice =
    scope === "assigned" || scope === "team"
      ? "Assignment and team filters are not available. This view shows all pending actions."
      : scope === "escalations"
        ? "Escalation filtering is not available. This view shows pending actions requiring human approval."
        : undefined;

  return (
    <HITLProvider requests={requests} currentUser={user} initialFilters={filters} initialSort={sort}>
      <HITLShell
        header={<HITLHeader title={title} description={description} />}
      >
        <div className="space-y-4 p-4 lg:p-6">
          {scopeNotice ? (
            <p role="note" className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {scopeNotice}
            </p>
          ) : null}
          {stats ? <HITLStatsCards stats={stats} /> : null}
          <HITLSLAAlerts requests={requests} onOpen={(r) => router.push(`/lawmate/hitl/${r.id}`)} />
          <div className="flex flex-wrap items-center gap-2">
            <HITLQueueSearch value={filters.query} onChange={(q) => setFilters((f) => ({ ...f, query: q }))} className="min-w-0 flex-1" />
            <HITLQueueFilters filters={filters} onFiltersChange={(n) => setFilters((f) => ({ ...f, ...n }))} onReset={() => setFilters({})} />
          </div>
          <HITLQueue
            requests={requests}
            loading={loading}
            view={view}
            onViewChange={setView}
            onOpen={(r) => router.push(`/lawmate/hitl/${r.id}`)}
            groupBy={(r) => r.status}
          />
        </div>
      </HITLShell>
    </HITLProvider>
  );
}
