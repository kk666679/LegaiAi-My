/**
 * Recent activity feed.
 *
 * Purpose
 * -------
 * A chronologically ordered list of things that happened in the workspace:
 * queries completed, documents analysed, workflows finished, artifacts
 * generated, research saved, documents uploaded. The component is data-driven
 * and receives an `ActivityItem[]` — no internal mock data.
 *
 * Props
 * -----
 * `items`         `ActivityItem[]` (see `types.ts`). Adapter `toActivityItem`
 *                 converts `RecentActivity` from `@/types/lawmate`.
 * `status`        `DashboardStatus` — delegated to `DashboardStateBoundary`.
 * `limit`         Max items to render before "Show more" (default 10).
 * `onLoadMore`    Called when the user presses "Show more" (client only).
 * `emptyState`    Override for the empty slot.
 * `compact`       Render as a dense timeline instead of cards.
 *
 * The `ActivityItem` kind maps to an icon and a human label via
 * `ACTIVITY_KIND_LABELS` in `types.ts`. Status is rendered via
 * `StatusPill` so colour is never the only signal.
 */

import { useState } from "react";
import {
  Activity,
  Bot,
  FileCheck,
  FileText,
  FolderOpen,
  Gavel,
  Save,
  Scale,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { EmptyState } from "@/components/shared/EmptyState";

import {
  CardListSkeleton,
  DashboardStateBoundary,
} from "@/components/dashboard/DashboardState";
import { StatusPill, MetricRow } from "@/components/dashboard/Indicators";
import type {
  ActivityItem,
  ActivityKind,
  DashboardStatus,
} from "@/components/dashboard/types";
import { ACTIVITY_KIND_LABELS } from "@/components/dashboard/types";
import { formatRelativeTime } from "@/components/dashboard/format";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<ActivityKind, React.ComponentType<{ className?: string }>> = {
  query_completed: Sparkles,
  document_analysed: FileCheck,
  workflow_completed: Gavel,
  artifact_generated: Bot,
  research_saved: Save,
  document_uploaded: FolderOpen,
};

export interface RecentActivityFeedProps {
  items?: readonly ActivityItem[];
  status?: DashboardStatus;
  error?: { message?: string | undefined } | string | null;
  onRetry?: () => void;
  limit?: number;
  onLoadMore?: () => void;
  emptyState?: React.ReactNode;
  compact?: boolean;
  heading?: string;
  className?: string;
}

export function RecentActivityFeed({
  items = [],
  status = "success",
  error,
  onRetry,
  limit = 10,
  onLoadMore,
  emptyState,
  compact = false,
  heading = "Recent activity",
  className,
}: RecentActivityFeedProps) {
  const [visibleCount, setVisibleCount] = useState(limit);
  const hasMore = items.length > visibleCount;
  const displayItems = items.slice(0, visibleCount);

  return (
    <section className={cn("space-y-3", className)} aria-label={heading}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4 shrink-0" aria-hidden />
          {heading}
        </CardTitle>
        {items.length > 0 ? (
          <Badge variant="outline" className="text-[10px]">
            {items.length} event{items.length === 1 ? "" : "s"}
          </Badge>
        ) : null}
      </CardHeader>

      <DashboardStateBoundary
        status={status}
        data={items}
        error={error}
        label="activity"
        isEmpty={(list) => list.length === 0}
        loading={<ActivitySkeleton />}
        empty={
          emptyState ?? (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Completed queries, analyses, workflows, artifacts and uploads will appear here."
            />
          )
        }
        errorFallback={
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-3 text-sm"
            role="alert"
          >
            <p className="font-medium text-destructive">Activity feed could not be loaded</p>
            <p className="mt-1 text-muted-foreground">
              {error instanceof Error ? error.message : "No data available."}
            </p>
            {onRetry && (
              <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        }
      >
        {(list) =>
          compact ? (
            <Timeline list={displayItems} />
          ) : (
            <CardList list={displayItems} />
          )
        }
      </DashboardStateBoundary>

      {hasMore && onLoadMore ? (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => {
            setVisibleCount((prev) => prev + limit);
            onLoadMore();
          }}
        >
          Show {Math.min(limit, items.length - visibleCount)} more
        </Button>
      ) : null}
    </section>
  );
}

function CardList({ list }: { list: readonly ActivityItem[] }) {
  return (
    <div className="space-y-2" role="list">
      {list.map((item, index) => (
        <ActivityCard key={item.id} item={item} index={index} />
      ))}
    </div>
  );
}

function Timeline({ list }: { list: readonly ActivityItem[] }) {
  return (
    <ol className="relative space-y-4 pl-4 border-l" role="list">
      {list.map((item, index) => (
        <li key={item.id} className="relative">
          <div className="absolute left-[-12px] top-1 size-2.5 rounded-full bg-primary" />
          <ActivityCard item={item} index={index} compact />
        </li>
      ))}
    </ol>
  );
}

function ActivityCard({
  item,
  index,
  compact = false,
}: {
  item: ActivityItem;
  index: number;
  compact?: boolean;
}) {
  const Icon = KIND_ICONS[item.kind];
  const label = ACTIVITY_KIND_LABELS[item.kind];
  const when = formatRelativeTime(item.at);

  return (
    <article
      className={cn(
        "flex flex-wrap items-start gap-2 rounded-lg border bg-card/40 p-3",
        compact && "pl-4",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        {item.detail ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>{when}</span>
          <Separator orientation="vertical" className="h-3" />
          <span>{label}</span>
          {item.status ? (
            <>
              <Separator orientation="vertical" className="h-3" />
              <StatusPill status={item.status} />
            </>
          ) : null}
        </div>
        {item.meta && item.meta.length > 0 ? (
          <ul className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            {item.meta.map((pair) => (
              <li key={pair.label} className="truncate">
                {pair.label}: {pair.value}
              </li>
            ))}
          </ul>
        ) : null}
        {item.href ? (
          <a
            href={item.href}
            className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
          >
            View details
            <Activity className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
      {compact ? null : (
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[10px]", index === 0 && "bg-primary/10 text-primary")}
        >
          {index + 1}
        </Badge>
      )}
    </article>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="rounded-lg border p-3 flex items-start gap-2"
        >
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2 w-1/2" />
            <Skeleton className="h-2 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}