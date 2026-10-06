"use client";
// app/legalai/research/_components/research-citations.tsx
import * as React from "react";
import { useResearch } from "./use-research";
import { CitationList, SourceList } from "@/components/dashboard/SourceList";
import { DashboardStateBoundary } from "@/components/dashboard/DashboardState";
import {
  toDashboardCitations,
  toDashboardSources,
  toDashboardStatus,
} from "./legalai-dashboard-adapters";

export function ResearchCitationsPage({ id }: { id: string }) {
  const { activeSession, sessionAuthorities } = useResearch({ sessionId: id });
  const status = activeSession ? toDashboardStatus(activeSession.status) : "loading";
  const sources = React.useMemo(() => toDashboardSources(sessionAuthorities), [sessionAuthorities]);
  const citations = React.useMemo(() => toDashboardCitations(sessionAuthorities), [sessionAuthorities]);
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <header>
        <h1 className="text-lg font-semibold">Citations</h1>
        <p className="text-xs text-muted-foreground">
          {sessionAuthorities.length} authorities cited in this session.
        </p>
      </header>

      <DashboardStateBoundary status={status} data={citations} isEmpty={(list) => list.length === 0} label="citations">
        {(list) => <CitationList citations={list} sources={sources} />}
      </DashboardStateBoundary>
      <DashboardStateBoundary status={status} data={sources} isEmpty={(list) => list.length === 0} label="sources">
        {(list) => <SourceList sources={list} heading="Cited authorities" collapsibleSnippet />}
      </DashboardStateBoundary>
    </div>
  );
}

