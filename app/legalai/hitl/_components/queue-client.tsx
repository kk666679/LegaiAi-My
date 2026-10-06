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
  currentTeam?: string;
}

export function QueueClient({ title, description, scope, currentUser, currentTeam }: QueueClientProps) {
  const router = useRouter();
  const [view, setView] = React.useState<HITLViewMode>("list");
  const [filters, setFilters] = React.useState<HITLFilters>({});
  const [sort, setSort] = React.useState<HITLSort>({ key: "priority", direction: "desc" });

  const user = currentUser ?? { id: "u-1", name: "You" };
  const { requests, stats, loading, error } = useHITLQueue({ filters, sort, scope, currentUserId: user.id, currentTeam });

  return (
    <HITLProvider requests={requests} currentUser={user} initialFilters={filters} initialSort={sort}>
      <HITLShell
        header={<HITLHeader title={title} description={description} />}
      >
        <div className="space-y-4 p-4 lg:p-6">
          {stats ? <HITLStatsCards stats={stats} /> : null}
          <HITLSLAAlerts requests={requests} onOpen={(r) => router.push(`/legalai/hitl/${r.id}`)} />
          <div className="flex flex-wrap items-center gap-2">
            <HITLQueueSearch value={filters.query} onChange={(q) => setFilters((f) => ({ ...f, query: q }))} className="min-w-0 flex-1" />
            <HITLQueueFilters filters={filters} onFiltersChange={(n) => setFilters((f) => ({ ...f, ...n }))} onReset={() => setFilters({})} />
          </div>
          <HITLQueue
            requests={requests}
            loading={loading}
            view={view}
            onViewChange={setView}
            onOpen={(r) => router.push(`/legalai/hitl/${r.id}`)}
            groupBy={(r) => r.status}
          />
        </div>
      </HITLShell>
    </HITLProvider>
  );
}
