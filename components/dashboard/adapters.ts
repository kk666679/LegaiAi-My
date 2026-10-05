/**
 * Adapters between the existing LawMate domain types and the dashboard
 * composites.
 *
 * These are the *only* place the two vocabularies meet, which keeps the
 * dashboard components free of `unknown`-typed backend payloads and keeps
 * `@/types/lawmate` free of view concerns. Each adapter is total: it returns
 * a dashboard type or `null`, and never throws on unexpected input.
 */

import type {
  ActivityItem,
  ActivityKind,
  Citation,
  DocumentArtifact,
  IRACAnalysis,
  IRACStage,
  IRACStageContent,
  SavedResearchItem,
  SavedItemKind,
  Source,
  SourceState,
} from "@/components/dashboard/types";

import type {
  LegalSource,
  RecentActivity,
  SavedItem,
} from "@/types/lawmate";

/**
 * Verification state for a `LegalSource`.
 *
 * `LegalSource.verified` is a boolean, so it maps to `verified` / `unverified`;
 * `unavailable` and `loading` are only reachable from newer payloads.
 */
export function toSourceState(verified: boolean | undefined): SourceState {
  if (verified === undefined) return "loading";
  return verified ? "verified" : "unverified";
}

/**
 * Widen an existing `LegalSource` into a dashboard `Source`.
 *
 * `documentName` is taken from the `authority` field when the source is a
 * document, since `LegalSource` stores the owning body in a single column.
 */
export function toSource(source: LegalSource): Source {
  return {
    id: source.id,
    title: source.title,
    documentName: source.type === "other" ? source.authority : undefined,
    authority: source.authority,
    section: source.section,
    jurisdiction: source.jurisdiction,
    legalArea: source.area,
    sourceType: source.type,
    date: source.publishedAt,
    url: source.url,
    snippet: source.excerpt,
    relevance: source.relevance,
    state: toSourceState(source.verified),
  };
}

/** Map `LegalSource[]` to `Source[]`, dropping entries without an id. */
export function toSources(sources: readonly LegalSource[] | undefined): Source[] {
  if (!sources) return [];
  return sources
    .filter((source): source is LegalSource => Boolean(source && source.id))
    .map(toSource);
}

const ACTIVITY_KIND_BY_LEGACY: Record<RecentActivity["kind"], ActivityKind> = {
  conversation: "query_completed",
  research: "research_saved",
  analysis: "document_analysed",
  document: "document_uploaded",
  draft: "artifact_generated",
  matter: "workflow_completed",
};

/**
 * Convert a `RecentActivity` row into an `ActivityItem`.
 *
 * Returns `null` for kinds the dashboard does not model, so callers can
 * `filter(Boolean)` rather than render a meaningless row.
 */
export function toActivityItem(item: RecentActivity): ActivityItem | null {
  const kind = ACTIVITY_KIND_BY_LEGACY[item.kind];
  if (!kind) return null;
  return {
    id: item.id,
    kind,
    title: item.title,
    detail: item.detail,
    at: item.at,
    href: item.href,
  };
}

const SAVED_KIND_BY_LEGACY: Record<SavedItem["kind"], SavedItemKind> = {
  answer: "query",
  research: "query",
  source: "source",
  clause: "artifact",
  document: "document",
};

/**
 * Convert a `SavedItem` row into a `SavedResearchItem`.
 *
 * `SavedItem.body` is used as the snippet, and `source` items additionally
 * carry a fully widened `Source` so bookmarked authorities keep their
 * verification state and citation metadata.
 */
export function toSavedResearchItem(item: SavedItem): SavedResearchItem {
  const kind = SAVED_KIND_BY_LEGACY[item.kind] ?? "query";
  return {
    id: item.id,
    kind,
    title: item.title,
    snippet: item.body,
    savedAt: item.savedAt,
    href: item.href,
    tags: item.tags,
    meta: item.matterId ? `Matter ${item.matterId}` : undefined,
  };
}

/**
 * Flat IRAC input, useful when a backend still returns four strings.
 * Wraps each string into a stage object so downstream rendering never has to
 * branch on a string-vs-object shape.
 */
export interface FlatIRACInput {
  issue?: string;
  rule?: string;
  analysis?: string;
  conclusion?: string;
  sources?: readonly Source[];
  citations?: readonly Citation[];
  confidence?: number;
  title?: string;
  /** Stages without text are reported as pending rather than silently dropped. */
  status?: "loading" | "partial" | "complete";
}

/** Wrap one flat string as an `IRACStageContent`. */
export function toIRACStage(
  stage: IRACStage,
  text: string | undefined,
): IRACStageContent {
  const trimmed = text?.trim();
  return {
    stage,
    text: trimmed && trimmed.length > 0 ? trimmed : undefined,
    status: trimmed && trimmed.length > 0 ? "complete" : "pending",
  };
}

/** Build an `IRACAnalysis` from the legacy flat shape. */
export function toIRACAnalysis(input: FlatIRACInput): IRACAnalysis {
  return {
    title: input.title,
    issue: toIRACStage("issue", input.issue),
    rule: toIRACStage("rule", input.rule),
    application: toIRACStage("application", input.analysis),
    conclusion: toIRACStage("conclusion", input.conclusion),
    sources: [...(input.sources ?? [])],
    citations: [...(input.citations ?? [])],
    confidence: input.confidence,
    status: input.status ?? "complete",
  };
}

/** Derive an artifact word count when the payload did not include one. */
export function withDerivedArtifactFields(
  artifact: DocumentArtifact,
): DocumentArtifact {
  if (artifact.wordCount !== undefined) return artifact;
  const words = artifact.content.trim();
  return {
    ...artifact,
    wordCount: words ? words.split(/\s+/).length : 0,
  };
}