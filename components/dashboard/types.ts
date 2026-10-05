/**
 * Dashboard domain types.
 *
 * This module is the single source of truth for the shapes rendered by
 * `components/dashboard/*`. It contains no component markup so it can be
 * imported from server components, client components and plain TypeScript
 * without pulling React into the graph.
 *
 * Conventions
 * -----------
 * - Timestamps are ISO-8601 `string`s, never `Date`, so data crosses the
 *   server/client boundary without serialisation surprises.
 * - `relevance` and `confidence` are normalised to `0..1`.
 * - Every enum-ish union is closed so the UI can switch exhaustively.
 *
 * Existing domain primitives from `@/types/lawmate` (`Document`,
 * `Jurisdiction`, `LegalArea`, `SourceType`, `LegalSource`, `RecentActivity`,
 * `SavedItem`) are reused rather than redeclared. The `adapters` module in
 * this folder converts them into the dashboard-specific composites below.
 */

import {
  CheckCircle2,
  CircleHelp,
  Gavel,
  Scale,
  type LucideIcon,
} from "lucide-react";

import type {
  Jurisdiction,
  LegalArea,
  SourceType,
} from "@/types/lawmate";

export type {
  Document,
  Jurisdiction,
  LegalArea,
  SourceType,
} from "@/types/lawmate";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

/**
 * The lifecycle every data-driven dashboard surface understands.
 *
 * `partial` is distinct from `success`: the request succeeded but some
 * sections are missing, degraded or failed individually.
 */
export type DashboardStatus = "loading" | "success" | "empty" | "error" | "partial";

/** Normalised confidence band. `insufficient` means "do not present as fact". */
export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";

/** Health/emphasis of a metric tile. Never communicated by colour alone. */
export type MetricStatus = "healthy" | "warning" | "error" | "neutral";

/** A single headline number on the dashboard. */
export interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  /** Rendered next to the value, e.g. `"%"`, `"credits"`, `"ms"`. */
  unit?: string;
  description?: string;
  status?: MetricStatus;
  /** `0..100`. Rendered as a progress bar when present. */
  progress?: number;
  /** Signed change against a comparison period. */
  delta?: {
    value: number;
    direction: "up" | "down" | "flat";
    period?: string;
  };
  icon?: LucideIcon;
  href?: string;
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export type QueryStatus =
  | "draft"
  | "queued"
  | "running"
  | "complete"
  | "partial"
  | "failed";

export interface Query {
  id: string;
  /** The question as posed by the user. */
  text: string;
  status: QueryStatus;
  createdAt: string;
  completedAt?: string;
  /** Court / tribunal filter, e.g. `"Federal Court"`. */
  court?: string;
  /** Workflow that executed this query, when it went through the orchestrator. */
  workflowId?: string;
  artifactIds?: string[];
}

/**
 * Everything produced by a single legal query: the answer, its evidentiary
 * basis (citations → sources), structured reasoning, generated artifacts and
 * the execution trace.
 */
export interface QueryResult {
  query: Query;
  answer?: string;
  citations: Citation[];
  sources: Source[];
  irac?: IRACAnalysis;
  artifacts: DocumentArtifact[];
  workflow?: Workflow;
  /** Non-fatal problems (e.g. "2 sources unavailable"). Rendered as a notice. */
  warnings?: string[];
}

/* ------------------------------------------------------------------ */
/* Workflows                                                           */
/* ------------------------------------------------------------------ */

export type WorkflowStatus = "queued" | "running" | "paused" | "complete" | "partial" | "failed";

export type WorkflowStepStatus = "pending" | "running" | "complete" | "skipped" | "failed";

export interface WorkflowStep {
  id: string;
  /** Stable machine key, e.g. `"retrieval"`, `"analysis"`, `"validation"`. */
  key: string;
  title: string;
  description?: string;
  status: WorkflowStepStatus;
  /** Queue/agent that owns the step, e.g. `"legal-retrieval"`. */
  agent?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  /** Tool input/output for the execution trace. */
  input?: Record<string, unknown>;
  output?: Record<string, unknown> | string;
  /** Sources produced by this step — draws the link from stage to authority. */
  sourceIds?: string[];
  error?: string;
}

export interface Workflow {
  id: string;
  title: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  query?: string;
  court?: string;
  startedAt?: string;
  completedAt?: string;
  /** `0..100` when the backend supplies it; otherwise derived from steps. */
  progress?: number;
}

/* ------------------------------------------------------------------ */
/* Artifacts                                                           */
/* ------------------------------------------------------------------ */

export type ArtifactType =
  | "summary"
  | "memo"
  | "clauses"
  | "issues"
  | "timeline"
  | "citations"
  | "findings"
  | "risk"
  | "draft";

export type ArtifactStatus = "pending" | "generating" | "complete" | "partial" | "error";

/** Lightweight pointer to a document an artifact was derived from. */
export interface SourceDocumentRef {
  id: string;
  title: string;
  href?: string;
}

export interface DocumentArtifact {
  id: string;
  title: string;
  type: ArtifactType;
  status: ArtifactStatus;
  /** Markdown-ish plain text body used for preview, copy and export. */
  content: string;
  /** ISO-8601. */
  generatedAt: string;
  updatedAt?: string;
  /** Documents this artifact was derived from. */
  sourceDocuments?: SourceDocumentRef[];
  /** `0..1` overall confidence; omit when the artifact is not scored. */
  confidence?: number;
  /** Citations relied upon by the artifact body. */
  citations?: Citation[];
  /** Source ids the artifact draws on. */
  sourceIds?: string[];
  /** Preferred export format; the card always offers a plain-text fallback. */
  format?: "markdown" | "text" | "html" | "pdf" | "docx";
  wordCount?: number;
  /** Set when the producer can re-run generation for this artifact. */
  canRegenerate?: boolean;
  /** Consumer-managed saved flag. The card never mutates it on its own. */
  isSaved?: boolean;
  /** User-facing failure message; only rendered when `status === "error"`. */
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Sources & citations                                                 */
/* ------------------------------------------------------------------ */

/** Verification state of an authority. Never inferred from colour alone. */
export type SourceState = "verified" | "unverified" | "unavailable" | "loading";

/**
 * A citable legal authority or source document.
 *
 * Field naming intentionally mirrors `LegalSource` in `@/types/lawmate`
 * (`title`, `authority`, `section`, `jurisdiction`, `url`, `excerpt`,
 * `relevance`) so the two map without ambiguity; the dashboard adds citation
 * metadata (`citation`, `court`, `date`, `page`) and an explicit `state`.
 * Use `toSource()` in `adapters.ts` to convert a `LegalSource`.
 */
export interface Source {
  id: string;
  title: string;
  /** Owning document, when the authority is a document rather than a case. */
  documentName?: string;
  /** Full citation string, e.g. `"[2023] 1 MLJ 123"`. */
  citation?: string;
  /** Issuing body, e.g. `"Parliament of Malaysia"` or `"Federal Court"`. */
  authority?: string;
  /** Section reference, e.g. `"s 14A(b)"`, `"Art 128"`. */
  section?: string;
  page?: number;
  jurisdiction?: Jurisdiction;
  court?: string;
  legalArea?: LegalArea;
  sourceType?: SourceType;
  /** Publication or decision date (ISO-8601 where known). */
  date?: string;
  url?: string;
  /** The passage actually relied upon. */
  snippet?: string;
  /** `0..1` relevance to the originating query. */
  relevance?: number;
  state?: SourceState;
}

/**
 * An inline citation marker inside reasoning or artifact text.
 *
 * `sourceId` is the relationship: `CitationList` resolves it against the
 * `Source[]` registry so the UI can show which authority backs which claim.
 */
export interface Citation {
  id: string;
  /** Text shown in the running body, e.g. `"Constitution, Art 5(1)"`. */
  label: string;
  sourceId?: string;
  /** Denormalised source, used when the citation is not in the registry. */
  source?: Source;
  /** Position in the citation list, used to render `[1]`, `[2]`, … */
  index?: number;
  href?: string;
  /** Pinpoint, e.g. `"at p 456"`, `"s 14A(b)"`. */
  locator?: string;
  state?: SourceState;
}

/* ------------------------------------------------------------------ */
/* IRAC reasoning                                                      */
/* ------------------------------------------------------------------ */

export type IRACStage = "issue" | "rule" | "application" | "conclusion";

export type IRACStageStatus = "complete" | "pending" | "unavailable";

/**
 * A highlighted legal proposition inside a reasoning stage — the sentences a
 * lawyer would pull out into a submission.
 */
export interface LegalProposition {
  id: string;
  text: string;
  /** Citations supporting the proposition. */
  citationIds?: string[];
  sourceIds?: string[];
}

export interface IRACStageContent {
  stage: IRACStage;
  /** Plain-text body of the stage. */
  text?: string;
  /** One-line summary shown while the stage is collapsed. */
  summary?: string;
  /** Structured propositions; rendered above the body when present. */
  propositions?: LegalProposition[];
  /** Citations made in this stage. */
  citationIds?: string[];
  /** Sources relied upon in this stage. */
  sourceIds?: string[];
  /** `0..1` confidence for this stage only. */
  confidence?: number;
  status?: IRACStageStatus;
}

/**
 * Structured Issue → Rule → Application → Conclusion reasoning.
 *
 * Every stage is a first-class object (not a bare string) so each one can
 * carry its own citations, sources, confidence and completeness state — the
 * reason the dashboard can render a partially finished analysis honestly.
 */
export interface IRACAnalysis {
  id?: string;
  title?: string;
  issue: IRACStageContent;
  rule: IRACStageContent;
  application: IRACStageContent;
  conclusion: IRACStageContent;
  /** Registry backing the citations above. */
  sources: Source[];
  citations: Citation[];
  /** `0..1` overall confidence. */
  confidence?: number;
  generatedAt?: string;
  /** `"partial"` while any stage is still pending. */
  status?: "loading" | "partial" | "complete";
}

export interface IRACStageDescriptor {
  key: IRACStage;
  /** Full name, e.g. `"Application"`. */
  label: string;
  /** Single-letter badge, e.g. `"A"`. */
  initial: string;
  description: string;
  icon: LucideIcon;
}

/** Canonical stage order. Drives rendering and keyboard navigation order. */
export const IRAC_STAGES: readonly IRACStageDescriptor[] = [
  {
    key: "issue",
    label: "Issue",
    initial: "I",
    description: "The legal question to be determined",
    icon: CircleHelp,
  },
  {
    key: "rule",
    label: "Rule",
    initial: "R",
    description: "Governing law, statute or precedent",
    icon: Scale,
  },
  {
    key: "application",
    label: "Application",
    initial: "A",
    description: "The rule applied to the facts",
    icon: Gavel,
  },
  {
    key: "conclusion",
    label: "Conclusion",
    initial: "C",
    description: "Answer on the balance of evidence",
    icon: CheckCircle2,
  },
];

/* ------------------------------------------------------------------ */
/* Credit usage                                                        */
/* ------------------------------------------------------------------ */

export type UsagePeriod = "day" | "week" | "month";

/** A single point on the usage trend. */
export interface UsagePoint {
  /** Axis label, e.g. `"Mon"`, `"W1"`, `"1 Oct"`. */
  label: string;
  /** Credits consumed in the bucket. */
  value: number;
}

export interface FeatureUsage {
  /** Stable feature key, e.g. `"legal-research"`. */
  feature: string;
  label: string;
  credits: number;
  /** `0..1`; derived from credits when omitted. */
  share?: number;
}

export interface UsageThreshold {
  /** `0..100` percent consumed. */
  at: number;
  label: string;
}

/** Everything `CreditUsageDashboard` renders. */
export interface UsageSummary {
  /** Credits granted for the current period. */
  totalAllocated: number;
  /** Credits consumed in the current period. */
  used: number;
  /** `totalAllocated - used`, floored at 0. */
  remaining: number;
  /** `0..100`, clamped. */
  percentConsumed: number;
  /** Trend buckets. Only the ones the dashboard needs should be supplied. */
  daily?: UsagePoint[];
  weekly?: UsagePoint[];
  monthly?: UsagePoint[];
  byFeature?: FeatureUsage[];
  /** ISO date the allocation is projected to run out, when it is within the period. */
  projectedExhaustion?: string | null;
  /** Bucket the trend chart should open on. */
  period?: UsagePeriod;
  /** Monetary value of a single credit, for the "usage value" panel. */
  valuePerCredit?: number;
  currency?: string;
  thresholds?: UsageThreshold[];
}

/* ------------------------------------------------------------------ */
/* Activity & saved research                                           */
/* ------------------------------------------------------------------ */

export type ActivityKind =
  | "query_completed"
  | "document_analysed"
  | "workflow_completed"
  | "artifact_generated"
  | "research_saved"
  | "document_uploaded";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  /** ISO-8601. */
  at: string;
  href?: string;
  /** Short label/value pairs rendered as a compact meta row. */
  meta?: Array<{ label: string; value: string }>;
  status?: MetricStatus;
}

export type SavedItemKind = "query" | "source" | "document" | "artifact";

export interface SavedResearchItem {
  id: string;
  kind: SavedItemKind;
  title: string;
  snippet?: string;
  savedAt: string;
  href?: string;
  tags?: string[];
  /** Present when `kind === "source"`. */
  source?: Source;
  /** Free-form trailing meta, e.g. `"Federal Court · 2019"`. */
  meta?: string;
}

/* ------------------------------------------------------------------ */
/* Display maps                                                        */
/* ------------------------------------------------------------------ */

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  summary: "Summary",
  memo: "Legal memo",
  clauses: "Extracted clauses",
  issues: "Issue list",
  timeline: "Timeline",
  citations: "Citations",
  findings: "Key findings",
  risk: "Risk analysis",
  draft: "Generated draft",
};

export const ARTIFACT_STATUS_LABELS: Record<ArtifactStatus, string> = {
  pending: "Queued",
  generating: "Generating",
  complete: "Complete",
  partial: "Partially complete",
  error: "Failed",
};

export const SOURCE_STATE_LABELS: Record<SourceState, string> = {
  verified: "Verified",
  unverified: "Unverified",
  unavailable: "Unavailable",
  loading: "Checking",
};

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  query_completed: "Query completed",
  document_analysed: "Document analysed",
  workflow_completed: "Workflow completed",
  artifact_generated: "Artifact generated",
  research_saved: "Research saved",
  document_uploaded: "Document uploaded",
};

export const QUERY_STATUS_LABELS: Record<QueryStatus, string> = {
  draft: "Draft",
  queued: "Queued",
  running: "Running",
  complete: "Complete",
  partial: "Partial result",
  failed: "Failed",
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  queued: "Queued",
  running: "Running",
  paused: "Paused",
  complete: "Complete",
  partial: "Completed with errors",
  failed: "Failed",
};

export const WORKFLOW_STEP_STATUS_LABELS: Record<WorkflowStepStatus, string> = {
  pending: "Pending",
  running: "Running",
  complete: "Complete",
  skipped: "Skipped",
  failed: "Failed",
};

export const METRIC_STATUS_LABELS: Record<MetricStatus, string> = {
  healthy: "Healthy",
  warning: "Needs attention",
  error: "Error",
  neutral: "Informational",
};

/** Default warning ladder used when `UsageSummary.thresholds` is omitted. */
export const DEFAULT_USAGE_THRESHOLDS: readonly UsageThreshold[] = [
  { at: 50, label: "Half used" },
  { at: 75, label: "Running low" },
  { at: 90, label: "Critical" },
  { at: 100, label: "Exhausted" },
];

/**
 * Bucket a `0..1` score into a band.
 *
 * Anything below `0.5` — or a missing score — is `"insufficient"`, which the
 * UI must render as "insufficient verified evidence" rather than as fact.
 */
export function confidenceLevel(score?: number): ConfidenceLevel {
  if (score === undefined || Number.isNaN(score)) return "insufficient";
  if (score >= 0.8) return "high";
  if (score >= 0.55) return "medium";
  if (score > 0) return "low";
  return "insufficient";
}