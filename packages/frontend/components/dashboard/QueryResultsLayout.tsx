"use client";

/**
 * Query results layout.
 *
 * Purpose
 * -------
 * Tabbed container for the three facets of a legal query answer:
 * Reasoning (IRAC), Artifacts (generated deliverables) and Workflow (agent
 * trace). The component is a thin orchestrator — all loading/empty/error/partial
 * logic lives in the individual facets, each of which uses
 * `DashboardStateBoundary`.
 *
 * Props
 * -----
 * `result`   `QueryResult` from `types.ts` — single object carrying answer,
 *            citations, sources, IRAC, artifacts and workflow.
 * `status`   `DashboardStatus` — passed to each facet so they render
 *            consistently.
 * `onRetry`  Recovery action propagated to each facet.
 *
 * No local loading flags — the `status` drives everything.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Brain, FileText, Workflow } from "lucide-react";

import { IRACReasoningTimeline } from "@/components/dashboard/IRACReasoningTimeline";
import { DocumentArtifactsResults } from "@/components/dashboard/DocumentArtifactsResults";
import { AgentWorkflowExplorer } from "@/components/dashboard/AgentWorkflowExplorer";
import type {
  DashboardStatus,
  QueryResult,
} from "@/components/dashboard/types";

export interface QueryResultsLayoutProps {
  result?: QueryResult;
  status?: DashboardStatus;
  onRetry?: () => void;
  className?: string;
}

export function QueryResultsLayout({
  result,
  status = "success",
  onRetry,
  className,
}: QueryResultsLayoutProps) {
  return (
    <Tabs defaultValue="reasoning" className={className}>
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="reasoning" className="flex items-center gap-2">
          <Brain className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Reasoning</span>
        </TabsTrigger>
        <TabsTrigger value="artifacts" className="flex items-center gap-2">
          <FileText className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Artifacts</span>
          {result?.artifacts.length ? (
            <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">
              {result.artifacts.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="workflow" className="flex items-center gap-2">
          <Workflow className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Workflow</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reasoning" className="space-y-3">
        <IRACReasoningTimeline
          analysis={result?.irac}
          status={status}
          onRetry={onRetry}
        />
      </TabsContent>

      <TabsContent value="artifacts" className="space-y-3">
        <DocumentArtifactsResults
          status={status}
          artifacts={result?.artifacts ?? []}
          sources={result?.sources ?? []}
          error={result?.warnings ? { message: result.warnings.join("; ") } : undefined}
          onRetry={onRetry}
        />
      </TabsContent>

      <TabsContent value="workflow" className="space-y-3">
        <AgentWorkflowExplorer
          workflow={result?.workflow}
          sources={result?.sources ?? []}
          status={status}
          error={result?.warnings ? { message: result.warnings.join("; ") } : undefined}
          onRetry={onRetry}
        />
      </TabsContent>
    </Tabs>
  );
}