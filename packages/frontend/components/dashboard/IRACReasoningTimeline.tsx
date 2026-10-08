"use client";

/**
 * IRAC reasoning visualisation.
 *
 * Purpose
 * -------
 * Presents legal reasoning as four distinct, separately inspectable stages —
 * Issue, Rule, Application, Conclusion — rather than one wall of prose. Each
 * stage carries its own summary, confidence score, highlighted legal
 * propositions, citations and source references, so a lawyer can audit the
 * reasoning step by step and jump straight to the authority behind any claim.
 *
 * Props
 * -----
 * `analysis`     `IRACAnalysis` — see `types.ts`. Four stage objects plus the
 *                source registry and citation list.
 * `status`       `DashboardStatus` — `loading` | `success` | `empty` |
 *                `error` | `partial`. Resolved through `DashboardStateBoundary`
 *                so loading/empty/error are never re-implemented here.
 * `onRetry`      Re-runs the query after an error; only then is an error state
 *                rendered with a retry affordance.
 * `defaultOpenStages` / `openStages` / `onOpenStagesChange`
 *                Uncontrolled or controlled disclosure state.
 * `maxBodyHeight`
 *                Pixel cap for a stage body before it scrolls. Keeps very long
 *                analyses navigable — the default is `384`.
 *
 * Expected data
 * -------------
 * A partially generated analysis is a first-class case: stages with
 * `status: "pending"` render as pending (never as empty prose), and the
 * container shows a partial notice instead of implying completeness.
 *
 * States
 * ------
 * loading · empty · error · partial (some stages pending) · success.
 */

import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Scale } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { QueryErrorState } from "@/components/dashboard/DashboardErrorStates";
import {
  DashboardStateBoundary,
  LiveStatus,
  PartialDataNotice,
} from "@/components/dashboard/DashboardState";
import { ConfidenceIndicator } from "@/components/dashboard/Indicators";
import {
  CitationBadge,
  SourceList,
  indexSources,
} from "@/components/dashboard/SourceList";
import type {
  Citation,
  DashboardStatus,
  IRACAnalysis,
  IRACStage,
  IRACStageContent,
  IRACStageDescriptor,
  LegalProposition,
  Source,
} from "@/components/dashboard/types";
import { IRAC_STAGES } from "@/components/dashboard/types";
import { formatDateTime, sourceAnchorId } from "@/components/dashboard/format";
import { cn } from "@/lib/utils";

export interface IRACReasoningTimelineProps {
  analysis?: IRACAnalysis | undefined;
  /** Defaults to `success` when an analysis is supplied, `empty` otherwise. */
  status?: DashboardStatus;
  onRetry?: () => void;
  /** Stages expanded on first render. Defaults to Issue + Conclusion. */
  defaultOpenStages?: IRACStage[];
  openStages?: IRACStage[];
  onOpenStagesChange?: (stages: IRACStage[]) => void;
  /** Pixel cap for a stage body before it scrolls. Default `384`. */
  maxBodyHeight?: number;
  /** Hide the source registry at the foot of the card. */
  hideSources?: boolean;
  className?: string;
}

const DEFAULT_OPEN: IRACStage[] = ["issue", "conclusion"];

export function IRACReasoningTimeline({
  analysis,
  status,
  onRetry,
  defaultOpenStages = DEFAULT_OPEN,
  openStages,
  onOpenStagesChange,
  maxBodyHeight = 384,
  hideSources = false,
  className,
}: IRACReasoningTimelineProps) {
  const controlled = openStages !== undefined;
  const [internalStages, setInternalStages] = useState<IRACStage[]>(defaultOpenStages);
  const activeStages = controlled ? openStages : internalStages;

  const resolvedStatus: DashboardStatus =
    status ??
    (analysis
      ? analysis.status === "loading"
        ? "loading"
        : analysis.status === "partial"
          ? "partial"
          : "success"
      : "empty");

  const handleOpenStagesChange = (next: string[]) => {
    const typed = next as IRACStage[];
    if (!controlled) setInternalStages(typed);
    onOpenStagesChange?.(typed);
  };

  const stages = useMemo(
    () =>
      analysis
        ? IRAC_STAGES.map((descriptor) => ({
            descriptor,
            content: analysis[descriptor.key],
          }))
        : [],
    [analysis],
  );

  const registry = useMemo(() => indexSources(analysis?.sources), [analysis?.sources]);
  const pendingCount = stages.filter(
    ({ content }) => content.status === "pending",
  ).length;

  const usedSources = useMemo(() => {
    if (!analysis) return [];
    const ids = new Set<string>();
    for (const { content } of stages) {
      for (const id of content.sourceIds ?? []) ids.add(id);
      for (const id of content.citationIds ?? []) {
        const citation = analysis.citations?.find((candidate) => candidate.id === id);
        if (citation?.sourceId) ids.add(citation.sourceId);
      }
    }
    for (const citation of analysis.citations ?? []) {
      if (citation.sourceId) ids.add(citation.sourceId);
    }
    if (ids.size === 0) return analysis.sources;
    return analysis.sources.filter((source) => ids.has(source.id));
  }, [analysis, stages]);

  const allCitations = analysis?.citations ?? [];
  const announce =
    resolvedStatus === "loading"
      ? "Reasoning in progress"
      : resolvedStatus === "partial" && pendingCount > 0
        ? `Reasoning partially complete. ${pendingCount} of 4 stages still pending.`
        : null;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="gap-3 border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{analysis?.title ?? "IRAC reasoning"}</span>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Issue → Rule → Application → Conclusion
            </p>
            {analysis?.generatedAt ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Generated {formatDateTime(analysis.generatedAt)}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline" className="gap-1 text-[10px]">
              {allCitations.length} citation{allCitations.length === 1 ? "" : "s"}
            </Badge>
            {usedSources.length > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const target = document.getElementById("irac-sources");
                  target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                }}
              >
                {usedSources.length} source{usedSources.length === 1 ? "" : "s"}
              </Button>
            ) : null}
          </div>
        </div>

        {analysis ? (
          <ConfidenceIndicator value={analysis.confidence} label="Overall confidence" />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              handleOpenStagesChange(IRAC_STAGES.map((stage) => stage.key))
            }
            disabled={resolvedStatus === "loading"}
          >
            Expand all
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenStagesChange([])}
          >
            Collapse all
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <LiveStatus message={announce} />

        <DashboardStateBoundary
          status={resolvedStatus}
          data={analysis}
          label="reasoning"
          loading={<IRACSkeleton />}
          empty={
            <EmptyState
              icon={Scale}
              title="No reasoning yet"
              description="Submit a legal question to see structured Issue, Rule, Application and Conclusion reasoning with its supporting authorities."
            />
          }
          errorFallback={
            <QueryErrorState
              description="The reasoning could not be generated. No authorities were recorded for this query."
              onRetry={onRetry}
            />
          }
        >
          {(value) => (
            <div className="space-y-3">
              {resolvedStatus === "partial" ? (
                <PartialDataNotice
                  message={`Partial analysis — ${pendingCount} of 4 stages are still being generated.`}
                  details={[
                    "Pending stages are shown as awaiting analysis, not as a finding.",
                    "Do not rely on this reasoning until every stage is complete.",
                  ]}
                />
              ) : null}

              <Accordion
                type="multiple"
                value={activeStages}
                onValueChange={handleOpenStagesChange}
                className="w-full"
              >
                {stages.map(({ descriptor, content }) => (
                  <IRACSection
                    key={descriptor.key}
                    descriptor={descriptor}
                    content={content}
                    citations={allCitations}
                    registry={registry}
                    maxBodyHeight={maxBodyHeight}
                  />
                ))}
              </Accordion>

              {!hideSources ? (
                <div id="irac-sources" className="border-t pt-4">
                  <SourceList
                    sources={usedSources}
                    heading="Source references"
                    collapsibleSnippet
                    emptyState={null}
                  />
                </div>
              ) : null}
            </div>
          )}
        </DashboardStateBoundary>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */

interface IRACSectionProps {
  descriptor: IRACStageDescriptor;
  content: IRACStageContent;
  citations: readonly Citation[];
  registry: Map<string, Source>;
  maxBodyHeight: number;
}

function IRACSection({
  descriptor,
  content,
  citations,
  registry,
  maxBodyHeight,
}: IRACSectionProps) {
  const Icon = descriptor.icon;
  const pending = content.status === "pending";
  const unavailable = content.status === "unavailable";
  const body = content.text?.trim();
  const hasContent = Boolean(body || (content.propositions?.length ?? 0) > 0);

  const stageCitations = resolveStageCitations(content, citations, registry);
  const stageSources = (content.sourceIds ?? [])
    .map((id) => registry.get(id))
    .filter((source): source is Source => Boolean(source));

  return (
    <AccordionItem value={descriptor.key} className="border-b last:border-b-0">
      <AccordionTrigger className="items-center gap-3 rounded-lg px-1 hover:no-underline">
        <span
          aria-hidden
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-md border text-[11px] font-semibold",
            pending || unavailable
              ? "border-dashed text-muted-foreground"
              : "border-primary/40 bg-primary/10 text-primary",
          )}
        >
          {descriptor.initial}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">{descriptor.label}</span>
            {pending ? (
              <Badge variant="outline" className="h-4 text-[10px]">
                Pending
              </Badge>
            ) : null}
            {unavailable ? (
              <Badge variant="outline" className="h-4 text-[10px]">
                Unavailable
              </Badge>
            ) : null}
            {stageCitations.length > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                {stageCitations.length} citation
                {stageCitations.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
            {pending
              ? `Awaiting ${descriptor.label.toLowerCase()} — still generating`
              : (content.summary ?? descriptor.description)}
          </span>
        </span>
      </AccordionTrigger>

      <AccordionContent className="px-1 pb-4">
        <div className="space-y-3 rounded-lg border-l-2 border-primary/30 bg-muted/30 p-3">
          {pending ? (
            <StageSkeleton lines={3} />
          ) : unavailable ? (
            <p className="text-sm text-muted-foreground">
              This stage could not be produced. Treat the analysis as incomplete.
            </p>
          ) : !hasContent ? (
            <p className="text-sm text-muted-foreground">
              No {descriptor.label.toLowerCase()} was recorded for this query.
            </p>
          ) : (
            <>
              {content.propositions?.length ? (
                <PropositionList
                  propositions={content.propositions}
                  citations={stageCitations}
                />
              ) : null}

              {body ? (
                <StageBody text={body} maxHeight={maxBodyHeight} />
              ) : null}

              {stageCitations.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Cited
                  </span>
                  {stageCitations.map((citation, position) => (
                    <CitationBadge
                      key={citation.id}
                      citation={citation}
                      index={citation.index ?? position + 1}
                    />
                  ))}
                </div>
              ) : null}

              {stageSources.length > 0 ? (
                <ul className="flex flex-wrap items-center gap-1.5">
                  <li className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Source references
                  </li>
                  {stageSources.map((source) => (
                    <li key={source.id}>
                      <a
                        href={`#${sourceAnchorId(source.id)}`}
                        className="rounded border px-1.5 py-0.5 text-[11px] underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {source.citation ?? source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}

          {content.confidence !== undefined && !pending ? (
            <ConfidenceIndicator
              value={content.confidence}
              label={`${descriptor.label} confidence`}
              hideBar
            />
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/* ------------------------------------------------------------------ */
/* Stage body                                                          */
/* ------------------------------------------------------------------ */

/**
 * Scroll-capped stage body with an explicit "show all" escape hatch.
 *
 * This is what keeps a multi-thousand-word analysis readable: the section
 * never grows without bound, and truncation is always visible and reversible
 * rather than silently cutting the reasoning off.
 */
function StageBody({ text, maxHeight }: { text: string; maxHeight: number }) {
  const [expanded, setExpanded] = useState(false);
  const clamped = !expanded && text.length > 600;

  return (
    <div className="space-y-1">
      <div
        style={clamped ? { maxHeight } : undefined}
        className={cn(
          "overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed",
          clamped && "pr-1",
        )}
      >
        {text}
      </div>
      {text.length > 600 ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-1.5 text-xs"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show full section"}
        </Button>
      ) : null}
    </div>
  );
}

/** Highlighted legal propositions — the quotable findings of a stage. */
function PropositionList({
  propositions,
  citations,
}: {
  propositions: readonly LegalProposition[];
  citations: readonly Citation[];
}) {
  return (
    <ul className="space-y-1.5" aria-label="Highlighted legal propositions">
      {propositions.map((proposition) => {
        const linked = (proposition.citationIds ?? [])
          .map((id) => citations.find((citation) => citation.id === id))
          .filter((citation): citation is Citation => Boolean(citation));

        return (
          <li
            key={proposition.id}
            className="rounded-md border border-primary/25 bg-primary/5 px-2.5 py-2"
          >
            <p className="text-sm leading-relaxed">{proposition.text}</p>
            {linked.length > 0 ? (
              <p className="mt-1 flex flex-wrap items-center gap-1.5">
                {linked.map((citation, position) => (
                  <CitationBadge
                    key={citation.id}
                    citation={citation}
                    index={citation.index ?? position + 1}
                  />
                ))}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Collect the citations that back a single stage.
 *
 * 1. Pull in every citation whose id appears in `content.citationIds`.
 * 2. For any `sourceId` on the stage that has no dedicated citation, synthesise
 *    one from the registry so the source is still listed under the stage.
 */
function resolveStageCitations(
  content: IRACStageContent,
  citations: readonly Citation[],
  registry: Map<string, Source>,
): Citation[] {
  const byId = new Map(citations.map((citation) => [citation.id, citation] as const));
  const resolved: Citation[] = [];

  for (const id of content.citationIds ?? []) {
    const citation = byId.get(id);
    if (citation) resolved.push(citation);
  }

  for (const sourceId of content.sourceIds ?? []) {
    if (resolved.some((citation) => citation.sourceId === sourceId)) continue;
    const source = registry.get(sourceId);
    if (!source) continue;
    resolved.push({
      id: `${sourceId}-stage-citation`,
      label: source.citation ?? source.title,
      sourceId,
      state: source.state,
    });
  }

  return resolved;
}

/** Loading placeholder for the whole reasoning card. */
export function IRACSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <LiveStatus message="Generating legal reasoning" />
      {IRAC_STAGES.map((stage) => (
        <div key={stage.key} className="rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="mt-3 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StageSkeleton({ lines }: { lines: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3", index % 2 === 1 ? "w-4/5" : "w-full")} />
      ))}
    </div>
  );
}