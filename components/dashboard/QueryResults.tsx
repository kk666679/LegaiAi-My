"use client";

/**
 * High-level query results component.
 *
 * Purpose
 * -------
 * Single entry point for rendering a legal query answer with its reasoning,
 * artifacts and workflow trace. It wraps everything in a
 * `DashboardStateBoundary` so callers only need to pass `status`, `data`
 * and `error` — no scattered loading flags.
 *
 * Props
 * -----
 * `status`       `DashboardStatus` — loading | success | empty | error | partial.
 * `result`       `QueryResult` from `types.ts` — the full payload when available.
 * `error`        Error object when `status === "error"`.
 * `onRetry`      Re-runs the query (surfaced in error/partial states).
 * `heading`      Optional section heading.
 *
 * Usage
 * -----
 * ```tsx
 * <QueryResults
 *   status={status}
 *   result={result}
 *   error={error}
 *   onRetry={refetch}
 * />
 * ```
 *
 * The component renders `QueryResultsLayout` when successful and appropriate
 * skeletons/empty/error states otherwise.
 */

import { Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DashboardStateBoundary,
  PartialDataNotice,
  LiveStatus,
} from "@/components/dashboard/DashboardState";
import { QueryErrorState } from "@/components/dashboard/DashboardErrorStates";
import { QueryResultsLayout } from "@/components/dashboard/QueryResultsLayout";
import { IRACSkeleton } from "@/components/dashboard/IRACReasoningTimeline";
import type {
  DashboardStatus,
  QueryResult,
} from "@/components/dashboard/types";
import { cn } from "@/lib/utils";

export interface QueryResultsProps {
  status: DashboardStatus;
  result?: QueryResult;
  error?: { message?: string | undefined } | string | null;
  onRetry?: () => void;
  heading?: string;
  className?: string;
}

export function QueryResults({
  status,
  result,
  error,
  onRetry,
  heading = "Query results",
  className,
}: QueryResultsProps) {
  const hasData = result && (
    result.answer ||
    (result.irac && (result.irac.issue.text || result.irac.rule.text || result.irac.application.text || result.irac.conclusion.text)) ||
    (result.artifacts?.length ?? 0) > 0 ||
    (result.workflow?.steps.length ?? 0) > 0
  );

  const isPartial = status === "partial" || result?.irac?.status === "partial";

  return (
    <section className={cn("space-y-4", className)} aria-label={heading}>
      <DashboardStateBoundary
        status={status}
        data={result}
        error={error}
        label="query results"
        isEmpty={() => !hasData}
        loading={<QuerySkeleton />}
        empty={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-4" aria-hidden />
                No results yet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Submit a legal question to see reasoning, generated artifacts and
                the agent workflow trace.
              </p>
            </CardContent>
          </Card>
        }
        errorFallback={<QueryErrorState error={error} onRetry={onRetry} />}
      >
        {() => (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-medium">{heading}</h2>
              {isPartial ? (
                <PartialDataNotice
                  message="Partial result — some sections are still being generated."
                  details={result?.warnings ?? ["Do not rely on this answer until every section is complete."]}
                />
              ) : null}
            </div>
            <LiveStatus message={isPartial ? "Results partially available" : null} />
            <QueryResultsLayout result={result} status={status} onRetry={onRetry} />
          </>
        )}
      </DashboardStateBoundary>
    </section>
  );
}

function QuerySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <IRACSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}