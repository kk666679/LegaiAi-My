/**
 * Reusable failure surfaces for dashboard regions.
 *
 * Errors are written for the reader, not the stack trace: the component
 * shows the region that failed, a plain-language explanation and the recovery
 * actions that actually exist (retry, refresh, go back, contact support).
 * Technical detail is deliberately dropped rather than rendered small and
 * grey, so nothing sensitive reaches the screen.
 *
 * All four states share one implementation and differ only in defaults, which
 * keeps wording and action order consistent across the workspace.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, LifeBuoy, RefreshCw, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  toErrorMessage,
  type DashboardError,
} from "@/components/dashboard/DashboardState";
import { INSUFFICIENT_EVIDENCE } from "@/components/dashboard/format";

export interface DashboardErrorStateProps {
  /** Region-level headline. Defaults to a generic sentence. */
  title?: string;
  /** Plain-language explanation of what went wrong. */
  description?: string;
  /** Error object from the failed request; only its message is surfaced. */
  error?: DashboardError;
  /** Omit when the region cannot be re-fetched. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Full refetch (e.g. invalidating a query cache). */
  onRefresh?: () => void;
  /** Explicit destination for "go back". When omitted the router is used. */
  backHref?: string;
  backLabel?: string;
  /** Support destination. Rendered only when supplied — never invented. */
  supportHref?: string;
  supportLabel?: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Generic failure surface. `QueryErrorState`, `WorkflowErrorState` and
 * `DocumentErrorState` are thin, region-specific wrappers over this.
 */
export function DashboardErrorState({
  title,
  description,
  error,
  onRetry,
  retryLabel = "Retry",
  onRefresh,
  backHref,
  backLabel = "Go back",
  supportHref,
  supportLabel = "Contact support",
  icon: Icon = AlertTriangle,
  className,
}: DashboardErrorStateProps) {
  const router = useRouter();
  const detail = toErrorMessage(error);

  const actions: Array<{ key: string; node: React.ReactNode }> = [];

  if (onRetry) {
    actions.push({
      key: "retry",
      node: (
        <Button size="sm" onClick={onRetry}>
          <RotateCcw aria-hidden />
          {retryLabel}
        </Button>
      ),
    });
  }

  if (onRefresh) {
    actions.push({
      key: "refresh",
      node: (
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw aria-hidden />
          Refresh
        </Button>
      ),
    });
  }

  if (backHref) {
    actions.push({
      key: "back",
      node: (
        <Button size="sm" variant="ghost" asChild>
          <Link href={backHref}>
            <ArrowLeft aria-hidden />
            {backLabel}
          </Link>
        </Button>
      ),
    });
  } else {
    actions.push({
      key: "back",
      node: (
        <Button size="sm" variant="ghost" onClick={() => router.back()}>
          <ArrowLeft aria-hidden />
          {backLabel}
        </Button>
      ),
    });
  }

  if (supportHref) {
    actions.push({
      key: "support",
      node: (
        <Button size="sm" variant="ghost" asChild>
          <Link href={supportHref}>
            <LifeBuoy aria-hidden />
            {supportLabel}
          </Link>
        </Button>
      ),
    });
  }

  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-heading text-sm font-medium text-destructive">
            {title ?? "This section could not be loaded"}
          </p>
          <p className="text-sm text-muted-foreground">
            {description ??
              "The request did not complete. Your data has not been changed."}
          </p>
          {detail ? (
            <p className="text-xs text-muted-foreground">{detail}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{INSUFFICIENT_EVIDENCE}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
        {actions.map((action) => (
          <span key={action.key}>{action.node}</span>
        ))}
      </div>
    </div>
  );
}

/** Failure surface for the query results region. */
export function QueryErrorState(props: Omit<DashboardErrorStateProps, "title">) {
  return (
    <DashboardErrorState
      title="This query could not be completed"
      description="The analysis did not finish. You can run it again or review the workflow trace for the stage that stopped."
      retryLabel="Re-run query"
      {...props}
    />
  );
}

/** Failure surface for the agent workflow region. */
export function WorkflowErrorState(props: Omit<DashboardErrorStateProps, "title">) {
  return (
    <DashboardErrorState
      title="The workflow trace could not be loaded"
      description="Some agent stages may have run without their results being recorded here."
      retryLabel="Reload trace"
      {...props}
    />
  );
}

/** Failure surface for document and artifact regions. */
export function DocumentErrorState(props: Omit<DashboardErrorStateProps, "title">) {
  return (
    <DashboardErrorState
      title="This document could not be loaded"
      description="The file may have moved, been archived, or be unavailable to your role."
      retryLabel="Try again"
      {...props}
    />
  );
}