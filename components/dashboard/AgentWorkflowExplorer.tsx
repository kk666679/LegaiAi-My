"use client";

/**
 * Agent workflow explorer.
 *
 * Purpose
 * -------
 * Renders an orchestrated legal workflow as an expandable trace: each agent
 * stage (retrieval → analysis → drafting → validation) becomes an inspectable
 * panel with its inputs, outputs, duration and produced sources. Status
 * handling is delegated to `DashboardStateBoundary`.
 *
 * Props
 * -----
 * `workflow`     `Workflow` from `types.ts` — steps, status, progress.
 * `sources`      Optional source registry to render in the footer.
 * `status`       `DashboardStatus` — loading/empty/error/success/partial.
 * `onRetry`      Recovery when `status === "error"`.
 */

import { useMemo } from "react";
import { Search, FileText, ShieldCheck, TrendingUp, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { DashboardStateBoundary } from "@/components/dashboard/DashboardState";
import { WorkflowErrorState } from "@/components/dashboard/DashboardErrorStates";
import type {
  DashboardStatus,
  Source,
  Workflow,
  WorkflowStep,
  WorkflowStepStatus,
} from "@/components/dashboard/types";
import { WORKFLOW_STEP_STATUS_LABELS } from "@/components/dashboard/types";
import { formatDuration } from "@/components/dashboard/format";
import { cn } from "@/lib/utils";

const STAGE_ICONS: Record<string, LucideIcon> = {
  retrieval: Search,
  analysis: FileText,
  drafting: ShieldCheck,
  validation: TrendingUp,
};

const STATUS_TONES: Record<WorkflowStepStatus, string> = {
  pending: "border-border bg-muted text-muted-foreground",
  running: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  complete: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  skipped: "border-border bg-muted text-muted-foreground",
  failed: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
};

export interface AgentWorkflowExplorerProps {
  workflow?: Workflow;
  /** Registry of sources produced by the workflow. */
  sources?: readonly Source[];
  status?: DashboardStatus;
  error?: { message?: string | undefined } | string | null;
  onRetry?: () => void;
  className?: string;
}

export function AgentWorkflowExplorer({
  workflow,
  sources,
  status = "success",
  error,
  onRetry,
  className,
}: AgentWorkflowExplorerProps) {
  const steps = workflow?.steps ?? [];
  const completedSteps = useMemo(
    () => steps.filter((step) => step.status === "complete").length,
    [steps],
  );
  const progressPercent =
    steps.length > 0
      ? Math.round((completedSteps / steps.length) * 100)
      : workflow?.progress ?? 0;

  return (
    <DashboardStateBoundary
      status={status}
      data={workflow}
      error={error}
      label="workflow trace"
      loading={<WorkflowSkeleton />}
      empty={
        <div className="text-sm text-muted-foreground p-4">
          No workflow trace is available for this query.
        </div>
      }
      errorFallback={<WorkflowErrorState error={error} onRetry={onRetry} />}
    >
      {() => (
        <Card className={cn("h-full border flex flex-col", className)}>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" aria-hidden />
                  <span className="truncate">Workflow explorer</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {workflow
                    ? `${completedSteps} of ${steps.length} stages complete`
                    : "No trace data"}
                </p>
              </div>
              {workflow ? (
                <Badge variant="secondary" className="font-mono flex-shrink-0">
                  #{workflow.id.slice(-6)}
                </Badge>
              ) : null}
            </div>
            <div className="mt-3">
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden space-y-4">
            {workflow ? (
              <>
                <div className="rounded-lg bg-muted/50 p-3 border border-muted text-sm space-y-2">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground block">
                      Query
                    </span>
                    <p className="text-sm font-medium line-clamp-2">
                      {workflow.query ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workflow.court ? (
                      <Badge variant="outline" className="text-xs">
                        Court: {workflow.court}
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="text-xs">
                      Trace: {workflow.id.slice(-8)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto pr-1">
                  {steps.map((step) => (
                    <WorkflowStepPanel key={step.id} step={step} />
                  ))}
                </div>

                {(sources?.length ?? 0) > 0 ? (
                  <div className="border-t pt-3">
                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Produced sources
                    </h4>
                    <ul className="flex flex-wrap gap-2">
                      {(sources ?? []).slice(0, 6).map((source) => (
                        <li key={source.id}>
                          <a
                            href={source.url ?? `#${source.id}`}
                            className="rounded border px-2 py-1 text-[11px] underline-offset-2 hover:underline"
                          >
                            {source.citation ?? source.title}
                          </a>
                        </li>
                      ))}
                      {(sources?.length ?? 0) > 6 ? (
                        <li>
                          <span className="rounded border px-2 py-1 text-[11px] text-muted-foreground">
                            +{(sources?.length ?? 0) - 6} more
                          </span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </DashboardStateBoundary>
  );
}

function WorkflowStepPanel({ step }: { step: WorkflowStep }) {
  const Icon = STAGE_ICONS[step.key] ?? Clock;
  const tone = STATUS_TONES[step.status];
  const sourceCount = (step.sourceIds ?? []).length;

  return (
    <Collapsible className="rounded-lg border overflow-hidden">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 bg-muted/40 px-3 py-2.5 text-left hover:no-underline">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          <span className="font-medium text-sm">{step.title}</span>
          <Badge variant="outline" className={cn("text-[10px]", tone)}>
            {WORKFLOW_STEP_STATUS_LABELS[step.status]}
          </Badge>
        </div>
        <Clock className="size-3 text-muted-foreground" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-3">
        <div className="space-y-3">
          {step.description && (
            <p className="text-xs text-muted-foreground italic">{step.description}</p>
          )}
          {step.input ? (
            <JsonView title="Input" data={step.input} />
          ) : null}
          {step.output ? (
            <JsonView title="Output" data={step.output} variant="output" />
          ) : null}
          {step.error && step.status === "failed" ? (
            <p className="text-xs text-destructive">{step.error}</p>
          ) : null}
          {step.durationMs ? (
            <p className="text-xs text-muted-foreground">
              Duration: {formatDuration(step.durationMs)}
            </p>
          ) : null}
          {sourceCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              Sources produced: {sourceCount}
            </p>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function JsonView({
  title,
  data,
  variant = "input",
}: {
  title: string;
  data: Record<string, unknown> | string;
  variant?: "input" | "output";
}) {
  const isError = variant === "output" && typeof data === "string" && data.toLowerCase().includes("error");
  const code =
    typeof data === "string"
      ? data
      : JSON.stringify(data, null, 2);
  return (
    <div className="space-y-1">
      <h5 className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {title}
      </h5>
      <pre
        className={cn(
          "overflow-x-auto rounded-md p-2 text-[11px]",
          isError
            ? "bg-destructive/10 text-destructive"
            : "bg-muted/50 text-foreground",
        )}
      >
        {code}
      </pre>
    </div>
  );
}

function WorkflowSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
      </Card>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

