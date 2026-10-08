/**
 * Source registry views: source lists and citation lists.
 *
 * These two are deliberately kept together because a citation without its
 * authority is decoration. `CitationList` resolves every `Citation` against
 * the `Source[]` registry and renders the link explicitly (citation → source),
 * so a reader can always see *why* a proposition is asserted.
 *
 * Server-safe: no hooks, no client state.
 */

import type { ReactNode } from "react";
import { ArrowRight, BookMarked, Quote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

import { SourceCard, SourceCardSkeleton } from "@/components/dashboard/SourceCard";
import type { Citation, Source } from "@/components/dashboard/types";
import {
  formatList,
  sourceAnchorId,
  INSUFFICIENT_EVIDENCE,
} from "@/components/dashboard/format";

/** Index a `Source[]` by id for O(1) citation resolution. */
export function indexSources(sources: readonly Source[] | undefined): Map<string, Source> {
  const map = new Map<string, Source>();
  if (!sources) return map;
  for (const source of sources) {
    if (source?.id) map.set(source.id, source);
  }
  return map;
}

/**
 * Resolve the authority behind a citation.
 *
 * Falls back to the citation's denormalised `source` when the citation is not
 * present in the registry, so inline citations remain meaningful even when the
 * caller only has a citation array.
 */
export function resolveCitationSource(
  citation: Citation,
  registry: Map<string, Source>,
): Source | undefined {
  if (citation.sourceId) {
    const found = registry.get(citation.sourceId);
    if (found) return found;
  }
  return citation.source;
}

/* ------------------------------------------------------------------ */
/* Inline citation marker                                              */
/* ------------------------------------------------------------------ */

export interface CitationBadgeProps {
  citation: Citation;
  /** 1-based marker; defaults to `citation.index`. */
  index?: number;
  className?: string;
}

/**
 * Inline `[n]` marker inside reasoning or artifact text.
 *
 * When the citation resolves to a source it becomes an in-page link to that
 * source card, so following a citation never leaves the current view.
 */
export function CitationBadge({ citation, index, className }: CitationBadgeProps) {
  const position = index ?? citation.index;
  const marker = position !== undefined ? `[${position}]` : `(${citation.label})`;
  const state = citation.state ?? citation.source?.state;

  if (!citation.sourceId && !citation.href) {
    return (
      <span
        className={cn(
          "font-mono text-[11px] text-muted-foreground",
          state === "unverified" && "underline decoration-dotted underline-offset-2",
          className,
        )}
      >
        {marker}
        <span className="sr-only">
          {` — ${citation.label}${state ? `, ${state}` : ""}`}
        </span>
      </span>
    );
  }

  return (
    <a
      href={citation.href ?? `#${sourceAnchorId(citation.sourceId ?? "")}`}
      className={cn(
        "rounded font-mono text-[11px] font-medium text-primary underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      title={citation.label}
    >
      {marker}
      <span className="sr-only">{` — ${citation.label}`}</span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Citation list                                                       */
/* ------------------------------------------------------------------ */

export interface CitationListProps {
  citations: readonly Citation[];
  /** Registry backing `Citation.sourceId`. */
  sources?: readonly Source[];
  /** Heading above the list. */
  title?: string;
  /** `compact` collapses each row to citation label → source title. */
  variant?: "compact" | "detailed";
  className?: string;
}

/**
 * Every citation with the authority behind it.
 *
 * `compact` is the default: one row per citation, citation on the left, the
 * resolved source (or an explicit "authority unavailable" note) on the right.
 */
export function CitationList({
  citations,
  sources,
  title = "Citations",
  variant = "compact",
  className,
}: CitationListProps) {
  if (citations.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        No citations were recorded for this section.
      </p>
    );
  }

  const registry = indexSources(sources);

  return (
    <section className={cn("space-y-2", className)} aria-label={title}>
      <h4 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Quote className="size-3" aria-hidden />
        {title}
        <Badge variant="outline" className="h-4 text-[10px]">
          {citations.length}
        </Badge>
      </h4>

      <ol className="space-y-1.5">
        {citations.map((citation, position) => {
          const source = resolveCitationSource(citation, registry);
          const marker = citation.index ?? position + 1;

          return (
            <li
              key={citation.id}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-muted/40 px-2 py-1.5 text-xs"
            >
              <span className="font-mono text-[11px] text-muted-foreground">[{marker}]</span>
              <span className="min-w-0 font-medium">{citation.label}</span>
              <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              {source ? (
                <a
                  href={`#${sourceAnchorId(source.id)}`}
                  className="min-w-0 truncate rounded underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {source.citation ?? source.title}
                  {citation.locator ? (
                    <span className="ml-1 font-mono text-[11px] text-muted-foreground">
                      {citation.locator}
                    </span>
                  ) : null}
                </a>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {INSUFFICIENT_EVIDENCE}
                </span>
              )}
              {variant === "detailed" && source?.jurisdiction ? (
                <span className="text-[11px] text-muted-foreground">
                  {source.court ? `${source.court} · ` : ""}
                  {source.jurisdiction}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Source list                                                         */
/* ------------------------------------------------------------------ */

export interface SourceListProps {
  sources: readonly Source[];
  /** Rendered when `sources` is empty. `null` renders nothing. */
  emptyState?: ReactNode;
  heading?: string;
  /** Collapse each passage behind a disclosure — useful for long lists. */
  collapsibleSnippet?: boolean;
  /** Per-source action slot, e.g. a bookmark toggle. */
  renderActions?: (source: Source, index: number) => ReactNode;
  className?: string;
}

/**
 * Ordered list of sources. Every card carries a stable anchor id so inline
 * citations elsewhere on the page can link directly to it.
 */
export function SourceList({
  sources,
  emptyState,
  heading,
  collapsibleSnippet = true,
  renderActions,
  className,
}: SourceListProps) {
  if (sources.length === 0) {
    if (emptyState === null) return null;
    return (
      <div className={className}>
        {emptyState ?? (
          <EmptyState
            icon={BookMarked}
            title="No sources attached"
            description="Nothing in this result is backed by a retrieved authority yet."
          />
        )}
      </div>
    );
  }

  return (
    <section className={cn("space-y-2", className)} aria-label={heading ?? "Sources"}>
      {heading ? (
        <h4 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <BookMarked className="size-3" aria-hidden />
          {heading}
          <Badge variant="outline" className="h-4 text-[10px]">
            {sources.length}
          </Badge>
        </h4>
      ) : null}

      <ol className="space-y-2">
        {sources.map((source, position) => (
          <li key={source.id}>
            <SourceCard
              source={source}
              index={position + 1}
              collapsibleSnippet={collapsibleSnippet}
              actions={renderActions?.(source, position + 1)}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Placeholder list used while the source registry resolves. */
export function SourceListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <SourceCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** "Used sources: A, B and C" — compact provenance line for headers. */
export function SourceSummaryLine({ sources }: { sources: readonly Source[] }) {
  if (sources.length === 0) return null;
  return (
    <p className="text-[11px] text-muted-foreground">
      Sources: {formatList(sources.map((source) => source.citation ?? source.title))}
    </p>
  );
}