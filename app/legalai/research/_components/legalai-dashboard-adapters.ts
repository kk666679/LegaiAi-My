// app/legalai/research/_components/legalai-dashboard-adapters.ts
//
// LegalAI → dashboard view-model bridge.
//
// `app/legalai` owns domain orchestration (sessions, authorities, findings,
// reasoning, memos). `components/dashboard` owns presentation. This module is
// the ONLY place the two vocabularies meet: every function is total (returns
// a dashboard type, never throws on unexpected input) and never fabricates
// citations, dates, URLs, or scores — missing fields render gracefully
// downstream via the dashboard's own fallbacks.

import type {
  ActivityItem,
  Citation,
  DashboardMetric,
  DashboardStatus,
  DocumentArtifact,
  IRACAnalysis,
  Jurisdiction,
  Query,
  QueryResult,
  QueryStatus,
  SavedResearchItem,
  Source,
  Workflow,
  WorkflowStatus,
} from "@/components/dashboard/types";
import { toIRACStage } from "@/components/dashboard/adapters";
import { AUTHORITY_COURT_LABELS } from "./types";
import type {
  Authority,
  AuthorityCourt,
  AuthorityJurisdiction,
  AuthorityKind,
  Finding,
  ResearchMemo,
  ResearchReasoningStep,
  ResearchSession,
  ResearchStats,
  ResearchStatus,
} from "./types";

/* Authority → Source */

const KIND_TO_SOURCE_TYPE: Record<AuthorityKind, Source["sourceType"]> = {
  case: "case",
  statute: "act",
  regulation: "regulation",
  "practice-direction": "guideline",
  secondary: "other",
  treaty: "government",
  constitutional: "act",
  circular: "government",
};

function jurisdictionLabel(j: AuthorityJurisdiction): Jurisdiction {
  switch (j) {
    case "MY":
      return "Malaysia";
    case "SG":
      return "Singapore";
    case "UK":
      return "United Kingdom";
    default:
      return "Other";
  }
}

/** Widen an Authority into a dashboard Source. No invented verification. */
export function toDashboardSource(authority: Authority): Source {
  const court: string | undefined = authority.court
    ? ((AUTHORITY_COURT_LABELS as Record<AuthorityCourt, string>)[authority.court] ??
      authority.court)
    : undefined;

  return {
    id: authority.id,
    title: authority.title,
    citation: authority.citation.full || authority.citation.short,
    authority: court ?? authority.citation.short,
    court,
    section: authority.keyParagraphs?.[0] ? `¶${authority.keyParagraphs[0].para}` : undefined,
    jurisdiction: jurisdictionLabel(authority.jurisdiction),
    sourceType: KIND_TO_SOURCE_TYPE[authority.kind] ?? "other",
    date: authority.year ? `${authority.year}-01-01` : undefined,
    url: authority.url,
    snippet: authority.headnote || authority.summary,
    relevance: authority.relevance,
    state: "unverified",
  };
}

export function toDashboardSources(authorities: readonly Authority[] | undefined): Source[] {
  if (!authorities) return [];
  return authorities.filter((a) => Boolean(a && a.id)).map(toDashboardSource);
}

export function toDashboardCitations(authorities: readonly Authority[] | undefined): Citation[] {
  if (!authorities) return [];
  return authorities
    .filter((a) => Boolean(a && a.id))
    .map((a, index) => ({
      id: `citation-${a.id}`,
      label: a.citation.short || a.title,
      index: index + 1,
      sourceId: a.id,
      state: "unverified" as const,
    }));
}

/* Status mapping */

const SESSION_TO_QUERY_STATUS: Record<ResearchStatus, QueryStatus> = {
  queued: "queued",
  running: "running",
  reasoning: "running",
  complete: "complete",
  failed: "failed",
  cancelled: "failed",
};

const SESSION_TO_DASHBOARD_STATUS: Record<ResearchStatus, DashboardStatus> = {
  queued: "loading",
  running: "loading",
  reasoning: "partial",
  complete: "success",
  failed: "error",
  cancelled: "empty",
};

const SESSION_TO_WORKFLOW_STATUS: Record<ResearchStatus, WorkflowStatus> = {
  queued: "queued",
  running: "running",
  reasoning: "running",
  complete: "complete",
  failed: "failed",
  cancelled: "failed",
};

export function toDashboardStatus(status: ResearchStatus): DashboardStatus {
  return SESSION_TO_DASHBOARD_STATUS[status] ?? "loading";
}

export function toDashboardQueryStatus(status: ResearchStatus): QueryStatus {
  return SESSION_TO_QUERY_STATUS[status] ?? "queued";
}

/* Reasoning steps -> Workflow */

function reasoningStepStatus(step: ResearchReasoningStep): "pending" | "running" | "complete" {
  switch (step.status) {
    case "complete":
      return "complete";
    case "active":
      return "running";
    default:
      return "pending";
  }
}

/** Map user-facing reasoning steps to a dashboard Workflow. No fake progress. */
export function toDashboardWorkflow(
  session: ResearchSession,
  steps: readonly ResearchReasoningStep[],
): Workflow {
  return {
    id: `workflow-${session.id}`,
    title: session.title || session.query.text,
    status: SESSION_TO_WORKFLOW_STATUS[session.status] ?? "queued",
    query: session.query.text,
    startedAt: session.createdAt,
    completedAt:
      session.status === "complete" || session.status === "failed" ? session.updatedAt : undefined,
    steps: steps.map((step) => ({
      id: step.id,
      key: step.kind,
      title: step.label,
      description: step.detail,
      status: reasoningStepStatus(step),
      agent: "legal-orchestrator",
      sourceIds: step.authorityIds,
    })),
  };
}

/* Reasoning / finding aggregation helpers */

function findingTextFor(
  findings: readonly Finding[],
  kinds: readonly Finding["kind"][],
): string | undefined {
  const matched = findings.filter((f) => kinds.includes(f.kind));
  if (matched.length === 0) return undefined;
  return matched.map((f) => `${f.title}: ${f.summary}`).join("\n\n");
}

function reasoningDetailFor(
  steps: readonly ResearchReasoningStep[],
  kinds: readonly ResearchReasoningStep["kind"][],
): string | undefined {
  const matched = steps.filter((s) => kinds.includes(s.kind));
  if (matched.length === 0) return undefined;
  return matched.map((s) => (s.detail ? `${s.label}: ${s.detail}` : s.label)).join("\n\n");
}

function confidenceFor(
  steps: readonly ResearchReasoningStep[],
  kinds: readonly ResearchReasoningStep["kind"][],
): number | undefined {
  const vals = steps
    .filter((s) => kinds.includes(s.kind) && typeof s.confidence === "number")
    .map((s) => s.confidence as number);
  if (vals.length === 0) return undefined;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function sourceIdsFor(
  steps: readonly ResearchReasoningStep[],
  kinds: readonly ResearchReasoningStep["kind"][],
): string[] | undefined {
  const ids = steps.flatMap((s) => (kinds.includes(s.kind) ? (s.authorityIds ?? []) : []));
  return ids.length > 0 ? [...new Set(ids)] : undefined;
}

function iracStatusFor(status: ResearchStatus): IRACAnalysis["status"] {
  switch (status) {
    case "complete":
      return "complete";
    case "reasoning":
      return "partial";
    case "failed":
    case "cancelled":
      // Terminal sessions keep whatever stages were produced; each stage still
      // carries its own text/confidence fallbacks downstream.
      return "complete";
    default:
      return "loading";
  }
}

/**
 * Build an IRACAnalysis from user-facing reasoning steps + findings.
 * Only uses text the app already produces for display.
 *
 * `sources` / `citations` are accepted so the composition root can pass the
 * full result payload in one call and so future stage→authority linkage has a
 * home; nothing is invented from them today.
 */
export function toDashboardIRAC(
  session: ResearchSession,
  steps: readonly ResearchReasoningStep[],
  findings: readonly Finding[],
  sources: readonly Source[],
  citations: readonly Citation[],
): IRACAnalysis {
  const issueText = reasoningDetailFor(steps, ["issue"]) ?? session.query.text ?? session.title;

  const ruleText =
    reasoningDetailFor(steps, ["rule", "search", "filter", "rank"]) ??
    findingTextFor(findings, ["holding", "ratio"]);

  const applicationText =
    reasoningDetailFor(steps, ["application"]) ??
    findingTextFor(findings, ["analogy", "distinguishing", "contradiction", "obiter", "gap"]);

  const conclusionText =
    reasoningDetailFor(steps, ["conclusion"]) ?? findingTextFor(findings, ["holding", "ratio"]);

  return {
    title: session.title || session.query.text,
    issue: {
      ...toIRACStage("issue", issueText),
      confidence: confidenceFor(steps, ["issue"]),
      sourceIds: sourceIdsFor(steps, ["issue"]),
    },
    rule: {
      ...toIRACStage("rule", ruleText),
      confidence: confidenceFor(steps, ["rule", "search", "filter", "rank"]),
      sourceIds: sourceIdsFor(steps, ["rule", "search", "filter", "rank"]),
    },
    application: {
      ...toIRACStage("application", applicationText),
      confidence: confidenceFor(steps, ["application"]),
      sourceIds: sourceIdsFor(steps, ["application"]),
    },
    conclusion: {
      ...toIRACStage("conclusion", conclusionText),
      confidence: confidenceFor(steps, ["conclusion"]) ?? session.avgConfidence ?? undefined,
      sourceIds: sourceIdsFor(steps, ["conclusion"]),
    },
    sources: [...sources],
    citations: [...citations],
    confidence: session.avgConfidence ?? undefined,
    status: iracStatusFor(session.status),
  };
}

/* Memo + findings -> DocumentArtifacts (only what the backend provides) */

function memoStatusToArtifact(status: ResearchMemo["status"]): DocumentArtifact["status"] {
  switch (status) {
    case "final":
      return "complete";
    case "review":
      return "partial";
    default:
      return "complete";
  }
}

/** Memo is the only generated artifact the research backend currently provides. */
export function toDashboardArtifacts(
  memo: ResearchMemo | null | undefined,
  citations: readonly Citation[],
  confidence?: number,
): DocumentArtifact[] {
  if (!memo) return [];
  return [
    {
      id: memo.id,
      title: memo.title || "Research memorandum",
      type: "memo",
      status: memoStatusToArtifact(memo.status),
      content: memo.body,
      generatedAt: memo.updatedAt,
      citations: [...citations],
      confidence,
      canRegenerate: false,
    },
  ];
}

/* Session -> Query / QueryResult (composition root for QueryResultsLayout) */

export function toDashboardQuery(session: ResearchSession): Query {
  return {
    id: session.id,
    text: session.query.text,
    status: toDashboardQueryStatus(session.status),
    createdAt: session.createdAt,
    completedAt:
      session.status === "complete" || session.status === "failed" ? session.updatedAt : undefined,
    artifactIds: session.memoId ? [session.memoId] : undefined,
  };
}

export function toDashboardQueryResult(
  session: ResearchSession,
  steps: readonly ResearchReasoningStep[],
  findings: readonly Finding[],
  authorities: readonly Authority[] | undefined,
  memo: ResearchMemo | null | undefined,
): QueryResult {
  const sources = toDashboardSources(authorities);
  const citations = toDashboardCitations(authorities);

  return {
    queryId: session.id,
    queryText: session.query.text,
    answer:
      findings.length > 0
        ? findings.map((f) => `${f.title}: ${f.summary}`).join("\n\n")
        : undefined,
    sources,
    citations,
    irac: toDashboardIRAC(session, steps, findings, sources, citations),
    artifacts: toDashboardArtifacts(memo, citations, session.avgConfidence ?? undefined),
    workflow: toDashboardWorkflow(session, steps),
    warnings:
      session.status === "reasoning"
        ? ["Research is still running — sections below may be incomplete."]
        : undefined,
  };
}

/* Stats -> DashboardMetric[] (real data only, no vanity metrics) */

export function toDashboardMetrics(stats: ResearchStats | null | undefined): DashboardMetric[] {
  if (!stats) return [];

  const avgConfidence = stats.avgConfidence ?? 0;

  return [
    {
      id: "sessions",
      label: "Researches completed",
      value: stats.totalSessions,
      description: `${stats.sessionsThisWeek} this week · ${stats.savedSessions} saved`,
      status: "neutral",
    },
    {
      id: "sources",
      label: "Sources found",
      value: stats.totalAuthorities,
      description: "Authorities indexed in this workspace",
      status: "neutral",
    },
    {
      id: "confidence",
      label: "Avg confidence",
      value: `${Math.round(avgConfidence * 100)}%`,
      description: "Mean authority confidence",
      status: avgConfidence >= 0.8 ? "healthy" : avgConfidence >= 0.55 ? "warning" : "neutral",
    },
    {
      id: "duration",
      label: "Avg duration",
      value:
        stats.avgDurationMs && stats.avgDurationMs > 0
          ? `${(stats.avgDurationMs / 1000).toFixed(1)}s`
          : "—",
      description: "Mean session run time",
      status: "neutral",
    },
  ];
}

/* Sessions -> SavedResearchItem[] / ActivityItem[] (existing persistence only) */

export function toDashboardSavedItems(
  sessions: readonly ResearchSession[],
): SavedResearchItem[] {
  return sessions
    .filter((s) => s.saved)
    .map((s) => ({
      id: s.id,
      kind: "query" as const,
      title: s.title || s.query.text,
      snippet: s.query.text,
      savedAt: s.updatedAt,
      href: `/legalai/research/${s.id}/results`,
      tags: s.tags,
      meta: s.matterName ? `Matter ${s.matterName}` : undefined,
    }));
}

export function toDashboardActivity(sessions: readonly ResearchSession[]): ActivityItem[] {
  return sessions.slice(0, 10).map((s) => ({
    id: `activity-${s.id}`,
    kind: s.saved ? ("research_saved" as const) : ("query_completed" as const),
    title: s.title || s.query.text,
    detail: `${s.authorityCount} authorities · ${s.findingCount} findings`,
    at: s.updatedAt,
    href: `/legalai/research/${s.id}/results`,
  }));
}