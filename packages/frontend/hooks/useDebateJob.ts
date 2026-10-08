"use client";

import { useMemo } from "react";
import type { Query } from "@tanstack/react-query";
import { trpcReact } from "@/clients";
import type {
  Debate,
  DebateArgument,
  DebateEntry,
  DebateEntryKind,
  DebateParticipant,
  DebateParticipantType,
  DebateRound,
  DebateSide,
  DebateSource,
  DebateStatus,
  DebateVerdict,
  DebateVerdictBasis,
} from "@/types/debate";

/**
 * Client view of a queued debate job.
 *
 * Polls `agents.debateStatus` while the worker runs and maps the
 * result payload onto the full `Debate` domain aggregate so the
 * workspace components (`components/debate/**`) can render it.
 *
 * The parser is tolerant: the worker today returns
 * `{ debateId, problem, rounds, transcript, judgment }`, but richer
 * optional fields (participants, scores, momentum, examinations,
 * evidence, sources, citations, verdict) are honoured when present so
 * the UI never has to invent data — sections simply stay hidden until
 * the worker provides them.
 */

/** The `agents.debateStatus` payload as the tRPC client sees it. */
export interface DebateJobSnapshot {
  state: string;
  result?: unknown;
}

/** Presentation state for the job page. */
export type DebateJobPresentation =
  | "queued"
  | "running"
  | "completed"
  | "failed";

/** Roster the debate worker runs with, keyed by transcript role. */
const ROSTER: Record<
  "applicant" | "respondent" | "judge",
  DebateParticipant
> = {
  applicant: {
    id: "applicant-counsel",
    name: "Applicant's counsel",
    type: "ai",
    side: "proponent",
    role: "Advocate for the applicant",
    initials: "AC",
    status: "idle",
    model: "Llama 3.1 (local)",
    persona:
      "Argues in favour of the proposition submitted. Grounds every submission in the authorities supplied with the debate.",
    tools: ["retrieval", "citation-validation"],
    classification: "internal",
  },
  respondent: {
    id: "respondent-counsel",
    name: "Respondent's counsel",
    type: "ai",
    side: "opponent",
    role: "Advocate for the respondent",
    initials: "RC",
    status: "idle",
    model: "Llama 3.1 (local)",
    persona:
      "Argues against the proposition submitted. Grounds every submission in the authorities supplied with the debate.",
    tools: ["retrieval", "citation-validation"],
    classification: "internal",
  },
  judge: {
    id: "judicial-assessor",
    name: "AI evaluator",
    type: "judge",
    side: "neutral",
    role: "Coram of one",
    initials: "JA",
    status: "idle",
    model: "Llama 3.1 (local)",
    persona:
      "Delivers an evaluative assessment of the opposing submissions. This is an AI evaluation, not a judicial decision.",
    classification: "internal",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/** Legacy transcript record: `{ round, role, argument, timestamp }`. */
interface RawTurn {
  round: number;
  role: "applicant" | "respondent" | "judge";
  argument: string;
  timestamp: string;
}

function parseTurn(value: unknown): RawTurn | null {
  if (!isRecord(value)) return null;
  const round = value.round;
  const role = value.role;
  const argument = value.argument;
  const timestamp = value.timestamp;
  if (
    typeof round !== "number" ||
    !Number.isInteger(round) ||
    (role !== "applicant" && role !== "respondent" && role !== "judge") ||
    typeof argument !== "string" ||
    typeof timestamp !== "string"
  ) {
    return null;
  }
  return { round, role, argument, timestamp };
}

/** Kind for an advocate entry: the first round opens, later rounds respond. */
function entryKindFor(round: number, indexInRound: number): DebateEntryKind {
  if (round <= 1) return "argument";
  if (indexInRound === 0) return "counterargument";
  return indexInRound % 2 === 1 ? "rebuttal" : "response";
}

/**
 * Maps the worker result onto the `Debate` aggregate. Returns `null`
 * when the payload does not match the known shape — callers treat that
 * as "result unavailable" rather than rendering partial data.
 */
export function parseDebateResult(value: unknown): Debate | null {
  if (!isRecord(value)) return null;
  const debateId = asString(value.debateId);
  const problem = asString(value.problem);
  const judgment = asString(value.judgment);
  const roundCount = asNumber(value.rounds);
  if (!debateId || !problem || !judgment || roundCount === undefined) {
    return null;
  }
  if (!Array.isArray(value.transcript)) return null;

  const turns: RawTurn[] = [];
  for (const item of value.transcript) {
    const turn = parseTurn(item);
    if (!turn) return null;
    turns.push(turn);
  }

  /* -- participants --------------------------------------------- */
  const present = new Set(turns.map((turn) => turn.role));
  const participants: DebateParticipant[] = (
    ["applicant", "respondent", "judge"] as const
  )
    .filter((role) => present.has(role))
    .map((role) => ({ ...ROSTER[role], status: "finished" as const }));

  /* -- round plan ----------------------------------------------- */
  const rounds: DebateRound[] = [];
  const totalRounds = Math.max(1, roundCount);
  for (let index = 1; index <= totalRounds; index += 1) {
    rounds.push({
      id: `round-${index}`,
      index,
      type: index === 1 ? "opening" : "argument",
      title:
        index === 1
          ? "Opening submissions"
          : `Argument round ${index}`,
      brief:
        index === 1
          ? "Each side states its opening position on the question submitted."
          : "Each side answers the opposing submissions from the previous round.",
      status: "completed",
    });
  }
  rounds.push({
    id: `round-${totalRounds + 1}`,
    index: totalRounds + 1,
    type: "judgment",
    title: "AI assessment",
    brief: "Evaluative assessment of the opposing submissions.",
    status: "completed",
  });

  /* -- transcript entries --------------------------------------- */
  const seen = new Map<number, number>();
  const entries: DebateEntry[] = turns.map((turn, index) => {
    const participant = ROSTER[turn.role];
    const position = seen.get(turn.round) ?? 0;
    seen.set(turn.round, position + 1);
    const isBench = turn.role === "judge";
    return {
      id: `${debateId}-entry-${index}`,
      roundId: isBench
        ? `round-${totalRounds + 1}`
        : `round-${Math.min(turn.round, totalRounds)}`,
      participantId: participant.id,
      role: participant.type as DebateParticipantType,
      side: participant.side as DebateSide,
      kind: isBench ? "judgment" : entryKindFor(turn.round, position),
      content: turn.argument,
      timestamp: turn.timestamp,
      generatedByAi: true,
    } satisfies DebateEntry;
  });

  /* -- arguments derived from advocate entries ------------------- */
  const arguments_: DebateArgument[] = entries
    .filter((entry) => entry.kind !== "judgment")
    .map((entry, index) => {
      const paragraphs = entry.content
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
      const claim = paragraphs[0] ?? entry.content;
      const reasoning = paragraphs.slice(1);
      return {
        id: `${debateId}-arg-${index}`,
        kind: entry.kind,
        side: entry.side,
        participantId: entry.participantId,
        roundId: entry.roundId,
        claim,
        reasoning: reasoning.length > 0 ? reasoning : undefined,
        generatedByAi: true,
        timestamp: entry.timestamp,
      } satisfies DebateArgument;
    });

  /* -- user-supplied authorities, when the result echoes them ---- */
  const sources: DebateSource[] = Array.isArray(value.citations)
    ? (value.citations as unknown[])
        .filter((citation): citation is string => typeof citation === "string")
        .map((citation, index) => ({
          id: `${debateId}-src-${index}`,
          title: citation,
          kind: "secondary" as const,
          citation,
          verificationStatus: "unverified" as const,
        }))
    : [];

  /* -- assessment / verdict -------------------------------------- */
  const verdict: DebateVerdict = {
    winnerId: null,
    outcome: "undecided",
    basis: "ai-evaluation" as DebateVerdictBasis,
    confidence: 0,
    summary: judgment,
    weaknesses: [
      "The worker does not verify generated arguments or authorities against primary sources.",
    ],
    recommendations: [
      "Check every proposition and citation against authoritative sources before relying on it.",
      "Treat this assessment as an AI aid for lawyer review, not as a judicial decision.",
    ],
    disclaimer:
      "AI evaluation of the submitted arguments. Not a judicial decision and not legal advice.",
  };

  /* -- optional richer fields the worker may provide ------------- */
  const momentum = Array.isArray(value.momentum)
    ? (value.momentum as Debate["momentum"])
    : undefined;
  const scores = Array.isArray(value.scores)
    ? (value.scores as Debate["scores"])
    : undefined;
  const examinations = Array.isArray(value.examinations)
    ? (value.examinations as Debate["examinations"])
    : undefined;
  const evidence = Array.isArray(value.evidence)
    ? (value.evidence as Debate["evidence"])
    : undefined;
  const extraSources = Array.isArray(value.sources)
    ? (value.sources as DebateSource[])
    : undefined;

  return {
    id: debateId,
    title: problem.split(/\n/)[0]?.slice(0, 120) ?? problem,
    status: "completed",
    issue: {
      title: problem.split(/\n/)[0]?.slice(0, 120) ?? problem,
      statement: problem,
      questionPresented: problem,
    },
    participants,
    rounds,
    entries,
    arguments: arguments_,
    evidence,
    sources: [...(extraSources ?? []), ...sources],
    examinations,
    momentum,
    scores,
    verdict,
    format: "adversarial-argument",
  };
}

/** Maps a raw job state onto the presentation union. */
export function jobPresentation(state: string | undefined): DebateJobPresentation {
  switch (state) {
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "active":
      return "running";
    default:
      return "queued";
  }
}

/** Debate lifecycle for the workspace badge, derived from the job state. */
export function jobStatus(state: string | undefined): DebateStatus {
  switch (state) {
    case "completed":
      return "completed";
    case "failed":
      return "error";
    case "active":
      return "running";
    default:
      return "waiting";
  }
}

export interface UseDebateJobResult {
  /** Raw tRPC query, for error handling and retry. */
  query: ReturnType<typeof trpcReact.agents.debateStatus.useQuery>;
  /** Job state as reported by the queue. */
  jobState: string | undefined;
  /** Presentation state for the page. */
  presentation: DebateJobPresentation;
  /** Debate lifecycle for badges. */
  status: DebateStatus;
  /** Mapped aggregate, or `null` until a well-formed result arrives. */
  debate: Debate | null;
}

/** Polls a debate job and exposes the mapped `Debate` aggregate. */
export function useDebateJob(jobId: string): UseDebateJobResult {
  const query = trpcReact.agents.debateStatus.useQuery(
    { jobId },
    {
      enabled: Boolean(jobId),
      refetchInterval: (currentQuery: Query<DebateJobSnapshot>) =>
        currentQuery.state.data?.state === "completed" ||
        currentQuery.state.data?.state === "failed"
          ? false
          : 2000,
    },
  );

  const jobState = query.data?.state;
  const debate = useMemo(() => {
    if (jobState !== "completed" || !query.data?.result) return null;
    return parseDebateResult(query.data.result);
  }, [jobState, query.data?.result]);

  return {
    query,
    jobState,
    presentation: jobPresentation(jobState),
    status: jobStatus(jobState),
    debate,
  };
}
