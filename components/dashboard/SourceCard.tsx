/**
 * Reusable legal source card.
 *
 * Purpose
 * -------
 * One component renders any authority the dashboard can cite: case law,
 * legislation, subsidiary legislation, guidelines, government publications and
 * uploaded documents. Every field the brief calls for — title, document name,
 * citation, jurisdiction, court, date, relevance, snippet, source type and
 * page/section pinpoint — is rendered from a single `Source`, so the same
 * information appears identically in reasoning, artifacts and lists.
 *
 * Expected data
 * -------------
 * `Source` from `@/components/dashboard/types` (convert a `LegalSource` with
 * `toSource()` from `adapters.ts`).
 *
 * States
 * ------
 * `loading`     skeleton body, no link, "Checking" badge.
 * `unavailable` muted card, link disabled, explicit unavailability message.
 * `unverified`  full card, link enabled, warning that it is not verified.
 * `verified`    full card with a verification badge.
 *
 * Accessibility
 * -------------
 * Rendered as an `<article>` with an `id`, so inline citations can link
 * straight to it. The passage sits behind a native `<details>` disclosure,
 * which is keyboard-operable without shipping JavaScript.
 */

import type { ReactNode } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CircleDashed,
  ClipboardList,
  FileText,
  Gavel,
  Globe2,
  Landmark,
  MapPin,
  Quote,
  ScrollText,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { RelevanceIndicator } from "@/components/dashboard/Indicators";
import type { Source, SourceState, SourceType } from "@/components/dashboard/types";
import {
  externalLinkProps,
  formatDate,
  sourceAnchorId,
  INSUFFICIENT_EVIDENCE,
} from "@/components/dashboard/format";

const SOURCE_TYPE_ICONS: Record<SourceType, LucideIcon> = {
  act: ScrollText,
  regulation: BookOpen,
  case: Gavel,
  guideline: ClipboardList,
  government: Building2,
  other: FileText,
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  act: "Legislation",
  regulation: "Subsidiary legislation",
  case: "Case law",
  guideline: "Guideline",
  government: "Government",
  other: "Document",
};

const STATE_CONFIG: Record<
  SourceState,
  { label: string; className: string; icon: LucideIcon; note?: string }
> = {
  verified: {
    label: "Verified",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: ShieldCheck,
  },
  unverified: {
    label: "Unverified",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: ShieldQuestion,
    note: "Not yet checked against the original text. Treat pinpoint references as provisional.",
  },
  unavailable: {
    label: "Unavailable",
    className: "border-border bg-muted text-muted-foreground",
    icon: CircleDashed,
    note: INSUFFICIENT_EVIDENCE,
  },
  loading: {
    label: "Checking",
    className: "border-border bg-muted text-muted-foreground",
    icon: CircleDashed,
  },
};

/** Fallback when a payload omits the state: unverified, never verified. */
function resolveState(state?: SourceState): SourceState {
  return state ?? "unverified";
}

export interface SourceCardProps {
  source: Source;
  /** 1-based position, rendered as a `[n]` marker when present. */
  index?: number;
  /** Hide the passage behind a disclosure. Default `false`. */
  collapsibleSnippet?: boolean;
  /** Render the relevance indicator. Default `true`. */
  showRelevance?: boolean;
  className?: string;
  /** Trailing slot for actions (bookmark, open document, …). */
  actions?: ReactNode;
}

/**
 * A single source. Safe to render on a server — the passage disclosure uses
 * the native `<details>` element.
 */
export function SourceCard({
  source,
  index,
  collapsibleSnippet = false,
  showRelevance = true,
  className,
  actions,
}: SourceCardProps) {
  const state = resolveState(source.state);
  const config = STATE_CONFIG[state];
  const StateIcon = config.icon;
  const unavailable = state === "unavailable";
  const loading = state === "loading";
  const TypeIcon = source.sourceType ? SOURCE_TYPE_ICONS[source.sourceType] : FileText;
  const titleId = `${sourceAnchorId(source.id)}-title`;
  const linkable = Boolean(source.url) && !unavailable;

  const title = linkable ? (
    <a
      href={source.url}
      {...externalLinkProps}
      className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {source.title}
    </a>
  ) : (
    source.title
  );

  return (
    <article
      id={sourceAnchorId(source.id)}
      aria-labelledby={titleId}
      className={cn(
        "flex flex-wrap items-start gap-x-3 gap-y-2 rounded-lg border bg-card/40 p-3",
        unavailable && "opacity-70",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {index !== undefined ? (
            <span className="font-mono text-[11px] text-muted-foreground">[{index}]</span>
          ) : null}
          <TypeIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <h4 id={titleId} className="min-w-0 text-sm font-medium leading-snug">
            {title}
          </h4>
        </div>

        {source.documentName ? (
          <p className="truncate text-xs text-muted-foreground">
            In <span className="italic">{source.documentName}</span>
          </p>
        ) : null}

        {source.citation ? (
          <p className="font-mono text-xs text-foreground/90">{source.citation}</p>
        ) : null}

        <ul className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {source.sourceType ? (
            <li>
              <Badge variant="outline" className="h-4 text-[10px]">
                {SOURCE_TYPE_LABELS[source.sourceType]}
              </Badge>
            </li>
          ) : null}
          {source.court ? (
            <li className="inline-flex items-center gap-1">
              <Landmark className="size-3" aria-hidden />
              {source.court}
            </li>
          ) : null}
          {source.jurisdiction ? (
            <li className="inline-flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {source.jurisdiction}
            </li>
          ) : null}
          {source.authority && !source.court ? (
            <li className="inline-flex items-center gap-1">
              <Globe2 className="size-3" aria-hidden />
              {source.authority}
            </li>
          ) : null}
          {source.date ? (
            <li className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" aria-hidden />
              {formatDate(source.date)}
            </li>
          ) : null}
          {source.page !== undefined ? (
            <li className="font-mono">p {source.page}</li>
          ) : null}
          {source.section ? <li className="font-mono">{source.section}</li> : null}
        </ul>

        {loading ? (
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ) : (
          <SnippetDisclosure
            snippet={source.snippet}
            collapsible={collapsibleSnippet}
          />
        )}

        {config.note ? (
          <p className="text-[11px] text-muted-foreground">{config.note}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <Badge variant="outline" className={cn("gap-1 text-[10px]", config.className)}>
          <StateIcon className="size-3" aria-hidden />
          {config.label}
        </Badge>
        {showRelevance && source.relevance !== undefined ? (
          <RelevanceIndicator value={source.relevance} />
        ) : null}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </article>
  );
}

/**
 * Passage disclosure. Collapsible form uses native `<details>` (zero JS, works
 * in a server component); otherwise a plain blockquote.
 */
function SnippetDisclosure({
  snippet,
  collapsible,
}: {
  snippet?: string;
  collapsible: boolean;
}) {
  const text = snippet?.trim();
  if (!text) return null;

  const passage = (
    <blockquote className="border-l-2 border-primary/40 pl-3 leading-relaxed text-muted-foreground">
      {text}
    </blockquote>
  );

  if (!collapsible) return <div className="text-xs">{passage}</div>;

  return (
    <details className="text-xs">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[11px] font-medium text-primary hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Quote className="size-3" aria-hidden />
        Show passage
      </summary>
      <div className="mt-1.5">{passage}</div>
    </details>
  );
}

/** Placeholder used while the source registry is still resolving. */
export function SourceCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-3", className)} aria-hidden>
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
    </div>
  );
}