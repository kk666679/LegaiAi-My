"use client";
// app/lawmate/research/_components/research-reasoning.tsx
import * as React from "react";
import { useResearch } from "./use-research";
import { IRACReasoningTimeline } from "@/components/dashboard/IRACReasoningTimeline";
import { AgentWorkflowExplorer } from "@/components/dashboard/AgentWorkflowExplorer";
import {
  toDashboardIRAC,
  toDashboardSources,
  toDashboardCitations,
  toDashboardStatus,
  toDashboardWorkflow,
} from "./lawmate-dashboard-adapters";

export function ResearchReasoningPage({ id }: { id: string }) {
  const { activeSession, sessionReasoning, sessionFindings, sessionAuthorities } = useResearch({ sessionId: id });
  const status = activeSession ? toDashboardStatus(activeSession.status) : "loading";
  const sources = React.useMemo(() => toDashboardSources(sessionAuthorities), [sessionAuthorities]);
  const citations = React.useMemo(() => toDashboardCitations(sessionAuthorities), [sessionAuthorities]);
  const analysis = activeSession
    ? toDashboardIRAC(activeSession, sessionReasoning, sessionFindings, sources, citations)
    : undefined;
  const workflow = activeSession ? toDashboardWorkflow(activeSession, sessionReasoning) : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <header>
        <h1 className="text-lg font-semibold">Reasoning</h1>
        <p className="text-xs text-muted-foreground">
          How LegAI reached its findings — user-facing summary, no private chain of thought.
        </p>
      </header>

      <IRACReasoningTimeline analysis={analysis} status={status} />
      <AgentWorkflowExplorer workflow={workflow} sources={sources} status={status} />
    </div>
  );
}

