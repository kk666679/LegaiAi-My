"use client";
// app/lawmate/research/_components/research-session-overview.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { useResearch } from "./use-research";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { SourceSummaryLine } from "@/components/dashboard/SourceList";
import { DashboardStateBoundary } from "@/components/dashboard/DashboardState";
import {
  toDashboardActivity,
  toDashboardMetrics,
  toDashboardSources,
} from "./lawmate-dashboard-adapters";

export function ResearchSessionOverview({ id }: { id: string }) {
  const router = useRouter();
  const { activeSession, sessions, stats, sessionAuthorities, sessionFindings } = useResearch({ sessionId: id });
  const metrics = React.useMemo(() => toDashboardMetrics(stats), [stats]);
  const activity = React.useMemo(() => toDashboardActivity(sessions), [sessions]);
  const sources = React.useMemo(() => toDashboardSources(sessionAuthorities), [sessionAuthorities]);

  if (!activeSession) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <header>
        <h1 className="mt-2 text-lg font-semibold">{activeSession.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{activeSession.query.text}</p>
        <SourceSummaryLine sources={sources} />
      </header>

      <DashboardMetrics metrics={metrics} />

      <DashboardStateBoundary status="success" data={activity} isEmpty={(list) => list.length === 0} label="session activity">
        {(list) => <RecentActivityFeed items={list} heading="Session activity" compact />}
      </DashboardStateBoundary>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push(`/lawmate/research/${id}/results`)}
          className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
        >
          View results
        </button>
        <button
          type="button"
          onClick={() => router.push(`/lawmate/research/${id}/memo`)}
          className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
        >
          Open memo
        </button>
        <button
          type="button"
          onClick={() => router.push(`/lawmate/research/${id}/reasoning`)}
          className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
        >
          See reasoning
        </button>
      </div>

      {sessionFindings.length > 0 ? (
        <div className="rounded-lg border border-border/60 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Top findings
          </p>
          <ul className="space-y-2">
            {sessionFindings.slice(0, 3).map((f) => (
              <li key={f.id} className="text-sm">
                <p className="font-medium">{f.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{f.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
