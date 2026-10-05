/**
 * Saved research collection.
 *
 * Purpose
 * -------
 * Renders bookmarked queries, sources, documents and artifacts in a single
 * filterable list. The component is data-driven and receives
 * `SavedResearchItem[]` — no internal mock data. Adapters in `adapters.ts`
 * convert `SavedItem` from `@/types/lawmate`.
 *
 * Props
 * -----
 * `items`          `SavedResearchItem[]` (see `types.ts`).
 * `status`         `DashboardStatus` — delegated to `DashboardStateBoundary`.
 * `filter`         Current kind filter; `null` = all. Controlled via
 *                  `onFilterChange` or uncontrolled via `defaultFilter`.
 * `onRemove`       Called with the item id when the user removes an entry.
 *                  Omit to hide the remove button.
 * `onOpen`         Called with the item when the user opens it.
 *                  Omit to hide the "Open" action and rely on `item.href`.
 * `emptyState`     Override for the empty slot.
 * `compact`        Render as a dense list instead of cards.
 *
 * States
 * ------
 * Each item carries its kind (`query` | `source` | `document` | `artifact`)
 * which determines the leading icon and the metadata displayed.
 */

import { useState } from "react";
import {
  Bookmark,
  BookOpen,
  FileCheck,
  FileText,
  FolderOpen,
  Quote,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { EmptyState } from "@/components/shared/EmptyState";

import {
  CardListSkeleton,
  DashboardStateBoundary,
} from "@/components/dashboard/DashboardState";
import { SourceCard } from "@/components/dashboard/SourceCard";
import type {
  DashboardStatus,
  SavedResearchItem,
  SavedItemKind,
} from "@/components/dashboard/types";
import { formatRelativeTime, sourceAnchorId } from "@/components/dashboard/format";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<SavedItemKind, React.ComponentType<{ className?: string }>> = {
  query: Search,
  source: BookOpen,
  document: FileText,
  artifact: FileCheck,
};

const KIND_LABELS: Record<SavedItemKind, string> = {
  query: "Query",
  source: "Source",
  document: "Document",
  artifact: "Artifact",
};

export interface SavedResearchProps {
  items?: readonly SavedResearchItem[];
  status?: DashboardStatus;
  error?: { message?: string | undefined } | string | null;
  onRetry?: () => void;
  filter?: SavedItemKind | null;
  defaultFilter?: SavedItemKind | null;
  onFilterChange?: (kind: SavedItemKind | null) => void;
  onRemove?: (id: string) => void;
  onOpen?: (item: SavedResearchItem) => void;
  emptyState?: React.ReactNode;
  compact?: boolean;
  heading?: string;
  className?: string;
}

export function SavedResearch({
  items = [],
  status = "success",
  error,
  onRetry,
  filter,
  defaultFilter = null,
  onFilterChange,
  onRemove,
  onOpen,
  emptyState,
  compact = false,
  heading = "Saved research",
  className,
}: SavedResearchProps) {
  const controlled = filter !== undefined;
  const [internalFilter, setInternalFilter] = useState(defaultFilter);
  const activeFilter = controlled ? filter : internalFilter;
  const handleFilterChange = (kind: SavedItemKind | null) => {
    if (!controlled) setInternalFilter(kind);
    onFilterChange?.(kind);
  };

  const filtered = activeFilter
    ? items.filter((item) => item.kind === activeFilter)
    : items;

  return (
    <section className={cn("space-y-3", className)} aria-label={heading}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2 pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bookmark className="size-4 shrink-0" aria-hidden />
          {heading}
        </CardTitle>
        {items.length > 0 ? (
          <Badge variant="outline" className="text-[10px]">
            {items.length} item{items.length === 1 ? "" : "s"}
          </Badge>
        ) : null}
      </CardHeader>

      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by kind">
          <FilterButton
            kind={null}
            label="All"
            active={activeFilter === null}
            onClick={() => handleFilterChange(null)}
          />
          {(Object.keys(KIND_LABELS) as SavedItemKind[]).map((kind) => (
            <FilterButton
              key={kind}
              kind={kind}
              label={KIND_LABELS[kind]}
              active={activeFilter === kind}
              onClick={() => handleFilterChange(kind)}
              count={items.filter((item) => item.kind === kind).length}
            />
          ))}
        </div>
      ) : null}

      <DashboardStateBoundary
        status={status}
        data={filtered}
        error={error}
        label="saved research"
        isEmpty={(list) => list.length === 0}
        loading={<SavedSkeleton />}
        empty={
          emptyState ?? (
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              description="Bookmark queries, sources, documents and artifacts to revisit them here."
            />
          )
        }
        errorFallback={
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-3 text-sm"
            role="alert"
          >
            <p className="font-medium text-destructive">Saved research could not be loaded</p>
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
            <SavedList list={list} onOpen={onOpen} onRemove={onRemove} />
          ) : (
            <SavedCards list={list} onOpen={onOpen} onRemove={onRemove} />
          )
        }
      </DashboardStateBoundary>
    </section>
  );
}

function FilterButton({
  kind,
  label,
  active,
  onClick,
  count = 0,
}: {
  kind: SavedItemKind | null;
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
      {count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px]",
            active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SavedList({
  list,
  onOpen,
  onRemove,
}: {
  list: readonly SavedResearchItem[];
  onOpen?: (item: SavedResearchItem) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <ol className="space-y-2" role="list">
      {list.map((item) => (
        <SavedRow key={item.id} item={item} onOpen={onOpen} onRemove={onRemove} />
      ))}
    </ol>
  );
}

function SavedCards({
  list,
  onOpen,
  onRemove,
}: {
  list: readonly SavedResearchItem[];
  onOpen?: (item: SavedResearchItem) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      {list.map((item) => (
        <SavedCard key={item.id} item={item} onOpen={onOpen} onRemove={onRemove} />
      ))}
    </div>
  );
}

function SavedRow({
  item,
  onOpen,
  onRemove,
}: {
  item: SavedResearchItem;
  onOpen?: (item: SavedResearchItem) => void;
  onRemove?: (id: string) => void;
}) {
  const Icon = KIND_ICONS[item.kind];
  const label = KIND_LABELS[item.kind];
  const when = formatRelativeTime(item.savedAt);
  const canOpen = Boolean(onOpen || item.href);
  const canRemove = Boolean(onRemove);

  return (
    <li
      className="flex items-center justify-between gap-3 rounded-lg border bg-card/40 px-3 py-2"
      role="listitem"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {item.snippet ? `${item.snippet.slice(0, 80)}…` : `${label} · ${when}`}
          </p>
        </div>
        {item.kind === "source" && item.source ? (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {item.source.state ?? "unverified"}
          </Badge>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {canOpen ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => onOpen?.(item)}
          >
            Open
          </Button>
        ) : item.href ? (
          <a
            href={item.href}
            className="rounded px-2 py-1 text-xs underline-offset-2 hover:underline"
          >
            Open
          </a>
        ) : null}
        {canRemove && onRemove ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${item.title}`}
              >
                <X className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Remove this item</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onRemove(item.id)}
                className="text-destructive focus:text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </li>
  );
}

function SavedCard({
  item,
  onOpen,
  onRemove,
}: {
  item: SavedResearchItem;
  onOpen?: (item: SavedResearchItem) => void;
  onRemove?: (id: string) => void;
}) {
  const Icon = KIND_ICONS[item.kind];
  const label = KIND_LABELS[item.kind];
  const when = formatRelativeTime(item.savedAt);
  const canOpen = Boolean(onOpen || item.href);
  const canRemove = Boolean(onRemove);

  return (
    <article
      className="flex flex-col gap-2 rounded-lg border bg-card/40 p-3"
      role="listitem"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {label} · {when}
            </p>
          </div>
        </div>
        {canRemove && onRemove ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${item.title}`}
              >
                <X className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Remove this item</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onRemove(item.id)}
                className="text-destructive focus:text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {item.snippet ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.snippet}</p>
      ) : null}

      {item.kind === "source" && item.source ? (
        <SourceCard
          source={item.source}
          index={undefined}
          collapsibleSnippet
          showRelevance={false}
          className="border-t pt-2"
        />
      ) : null}

      <div className="flex items-center justify-between pt-1">
        {item.tags && item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="h-4 text-[10px]">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="h-4 text-[10px]">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        ) : null}

        <div className="flex shrink-0 gap-1.5">
          {canOpen ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() => onOpen?.(item)}
              disabled={!onOpen && !item.href}
            >
              Open
            </Button>
          ) : item.href ? (
            <a
              href={item.href}
              className="inline-flex items-center justify-center size-7 rounded border px-2 text-xs underline-offset-2 hover:underline"
            >
              Open
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SavedSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-lg border p-3 flex items-center gap-3">
          <Skeleton className="size-4 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}