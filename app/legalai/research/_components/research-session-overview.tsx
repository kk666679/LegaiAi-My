"use client";
// app/legalai/research/_components/research-session-overview.tsx
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
} from "./legalai-dashboard-adapters";

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
        <div className="flex flex-wrap items-center gap-2">
          <ResearchStatusBadge status={activeSession.status} compact />
          {activeSession.avgConfidence != null ? (
            <ConfidenceMeter value={activeSession.avgConfidence} compact />
          ) : null}
        </div>
        <h1 className="mt-2 text-lg font-semibold">{activeSession.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{activeSession.query.text}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Authorities" value={String(activeSession.authorityCount)} />
        <Stat label="Findings" value={String(activeSession.findingCount)} />
        <Stat label="Duration" value={activeSession.durationMs ? `${(activeSession.durationMs / 1000).toFixed(1)}s` : "—"} />
        <Stat label="Sources" value={`${sessionAuthorities.length} cited`} />
      </div>

      <Card className="p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Session details
        </p>
        <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <Row label="Owner" value={activeSession.ownerName ?? "—"} />
          <Row label="Matter" value={activeSession.matterName ?? "—"} />
          <Row label="Client" value={activeSession.clientName ?? "—"} />
          <Row label="Created" value={new Date(activeSession.createdAt).toLocaleString()} />
          <Row label="Updated" value={new Date(activeSession.updatedAt).toLocaleString()} />
          <Row label="Saved" value={activeSession.saved ? "Yes" : "No"} />
        </dl>
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Scope</p>
        <div className="flex flex-wrap gap-1.5">
          {activeSession.query.scope.jurisdictions.map((j) => (
            <Badge key={j} variant="secondary" className="text-[10px]">{j}</Badge>
          ))}
          {activeSession.query.scope.kinds.map((k) => (
            <Badge key={k} variant="outline" className="text-[10px] capitalize">{k.replace("-", " ")}</Badge>
          ))}
        </div>
      </Card>

      {activeSession.tags?.length ? (
        <Card className="p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {activeSession.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => router.push(`/legalai/research/${id}/results`)}
          className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
        >
          View results
        </button>
        <button
          type="button"
          onClick={() => router.push(`/legalai/research/${id}/memo`)}
          className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
        >
          Open memo
        </button>
        <button
          type="button"
          onClick={() => router.push(`/legalai/research/${id}/reasoning`)}
          className="rounded-md border border-border/60 px-3 py-1.5 text-xs hover:bg-accent"
        >
          See reasoning
        </button>
      </div>

      {sessionFindings.length > 0 ? (
        <Card className="p-4">
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
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right">{value}</dd>
    </div>
  );
}
