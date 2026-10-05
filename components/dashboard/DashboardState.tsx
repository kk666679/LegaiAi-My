/**
 * Centralised state handling for data-driven dashboard components.
 *
 * Every dashboard surface answers the same five questions — loading,
 * success, empty, error, partial — so that logic lives here once instead of
 * being re-invented (and inconsistently) in each component.
 *
 * This module has **no hooks**, so it works unchanged in server components.
 * Consumers that need interactive recovery pass a client-rendered error state
 * (see `DashboardErrorStates.tsx`) through `renderError` / `errorFallback`.
 *
 * @example
 * ```tsx
 * <DashboardStateBoundary
 *   status={status}
 *   data={artifacts}
 *   isEmpty={(list) => list.length === 0}
 *   loading={<ArtifactListSkeleton />}
 *   empty={<EmptyState icon={FileText} title="No artifacts yet" />}
 *   errorFallback={<DocumentErrorState onRetry={retry} />}
 * >
 *   {(list) => <ArtifactList artifacts={list} />}
 * </DashboardStateBoundary>
 * ```
 */

import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

import type { DashboardStatus } from "@/components/dashboard/types";
import { INSUFFICIENT_EVIDENCE } from "@/components/dashboard/format";

/** Minimal shape of anything `catch` can produce. */
export interface DashboardErrorLike {
  message?: string | undefined;
  name?: string | undefined;
}

export type DashboardError = string | DashboardErrorLike | null | undefined;

/**
 * Human-readable message for an error, without leaking stack traces, SQL or
 * internal identifiers to the UI.
 */
export function toErrorMessage(error: DashboardError): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  const message = error.message?.trim();
  if (!message) return undefined;
  if (/^(uncaught|unhandled)/i.test(message)) return undefined;
  return message;
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

/**
 * Screen-reader-only status announcement.
 *
 * `role="status"` implies `aria-live="polite"`, so workflow and pipeline
 * changes are spoken without stealing focus. Render it next to whichever
 * region it describes.
 */
export function LiveStatus({ message }: { message?: string | null }) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {message ?? ""}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                           */
/* ------------------------------------------------------------------ */

export interface DashboardSkeletonProps {
  /** Number of placeholder rows. */
  rows?: number;
  className?: string;
  /** Announced while the placeholder is visible. */
  label?: string;
}

/** Generic text-block placeholder. */
export function DashboardSkeleton({
  rows = 3,
  className,
  label = "Loading",
}: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} data-testid="dashboard-skeleton">
      <LiveStatus message={label} />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          {index % 2 === 1 ? <Skeleton className="h-3 w-4/5" /> : null}
        </div>
      ))}
    </div>
  );
}

/** Placeholder for a grid of metric tiles. */
export function MetricGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}
      data-testid="metric-grid-skeleton"
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Placeholder for a vertical list of cards (sources, artifacts, activity). */
export function CardListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} data-testid="card-list-skeleton" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Partial data                                                        */
/* ------------------------------------------------------------------ */

/**
 * Notice rendered above partially available content.
 *
 * Partial results are the norm for long legal workflows — some sources time
 * out, some validation checks are still queued — so they are surfaced
 * explicitly rather than silently rendering as a complete answer.
 */
export function PartialDataNotice({
  message,
  details,
  className,
}: {
  message?: string;
  details?: readonly string[];
  className?: string;
}) {
  const items = (details ?? []).filter((detail) => detail.trim().length > 0);
  return (
    <div
      role="note"
      className={cn(
        "rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      <p className="font-medium">{message ?? "Partial result — some data is unavailable."}</p>
      {items.length > 0 ? (
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {items.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Boundary                                                            */
/* ------------------------------------------------------------------ */

export interface DashboardStateBoundaryProps<T> {
  /** Lifecycle of the data being rendered. */
  status: DashboardStatus;
  /** The payload. Rendered via `children` when status is success/partial. */
  data?: T | undefined;
  /** Error to surface when `status === "error"`. */
  error?: DashboardError;
  /** When true a successful-but-useless payload is treated as `empty`. */
  isEmpty?: boolean | ((data: T) => boolean);
  /** Rendered while loading. Defaults to a generic skeleton. */
  loading?: ReactNode;
  /** Rendered when there is nothing to show. */
  empty?: ReactNode;
  /** Rendered above the content when `status === "partial"`. */
  partial?: ReactNode;
  /** Rendered instead of `children` on error. */
  renderError?: (error: DashboardError, retry: boolean) => ReactNode;
  /** Simpler alternative to `renderError`. */
  errorFallback?: ReactNode;
  /** Content, or a render function receiving the narrowed payload. */
  children: ReactNode | ((data: NonNullable<T>) => ReactNode);
  className?: string;
  /** Accessible label describing this region. */
  label?: string;
}

/**
 * Renders exactly one of loading / empty / error / content, in a fixed order,
 * for any data-driven dashboard component.
 */
export function DashboardStateBoundary<T>({
  status,
  data,
  error,
  isEmpty,
  loading,
  empty,
  partial,
  renderError,
  errorFallback,
  children,
  className,
  label,
}: DashboardStateBoundaryProps<T>) {
  if (status === "loading") {
    return (
      <div className={className} aria-busy="true" aria-label={label}>
        {loading ?? <DashboardSkeleton label={label ? `Loading ${label}` : undefined} />}
      </div>
    );
  }

  if (status === "error") {
    const message = toErrorMessage(error);
    return (
      <div className={className} role="group" aria-label={label}>
        {renderError ? (
          renderError(error, Boolean(message))
        ) : (
          errorFallback ?? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-4 text-sm">
              <p className="font-medium text-destructive">
                {label ? `${label} could not be loaded.` : "This section could not be loaded."}
              </p>
              <p className="mt-1 text-muted-foreground">
                {message ?? INSUFFICIENT_EVIDENCE}
              </p>
            </div>
          )
        )}
      </div>
    );
  }

  const emptyResolved =
    typeof isEmpty === "function"
      ? data !== undefined && isEmpty(data)
      : Boolean(isEmpty);

  if (status === "empty" || emptyResolved) {
    return (
      <div className={className} aria-label={label}>
        {empty ?? (
          <EmptyState
            title={label ? `No ${label.toLowerCase()} yet` : "Nothing to show yet"}
            description="Completed work will appear here as it is processed."
          />
        )}
      </div>
    );
  }

  const content =
    typeof children === "function"
      ? data !== undefined
        ? children(data as NonNullable<T>)
        : null
      : children;

  if (status === "partial") {
    return (
      <div className={cn("space-y-3", className)} aria-label={label}>
        <LiveStatus message={`${label ?? "Results"} partially available`} />
        {partial ?? (
          <PartialDataNotice
            details={messageList(data)}
          />
        )}
        <div>{content}</div>
      </div>
    );
  }

  return <div className={className}>{content}</div>;
}

function messageList(data: unknown): readonly string[] {
  if (data && typeof data === "object" && "warnings" in data) {
    const warnings = (data as { warnings?: unknown }).warnings;
    if (Array.isArray(warnings)) {
      return warnings.filter((item): item is string => typeof item === "string");
    }
  }
  return [];
}