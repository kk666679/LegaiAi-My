/**
 * Legal Debate domain model.
 *
 * A debate is an adversarial reasoning workflow over a single legal issue:
 * participants (human advocates, AI advocates, judge, observers) exchange
 * arguments across explicit rounds, each grounded in evidence and authorities,
 * evaluated against criteria, and closed by a verdict.
 *
 * Nothing in this model asserts a legal conclusion. `DebateVerdict` carries an
 * explicit `basis` so AI evaluation is never rendered as a judicial decision.
 */

/* ------------------------------------------------------------------ */
/* Core enums                                                          */
/* ------------------------------------------------------------------ */

/** Which side of the controversy a participant or argument advances. */
export type DebateSide = "proponent" | "opponent" | "neutral";

/**
 * Participant kind. `judge` and `observer` sit on the bench and never
 * advance a side — they use `DebateSide` `"neutral"`.
 */
export type DebateParticipantType = "human" | "ai" | "judge" | "observer";

/** Lifecycle of a debate. Drives which states/actions the UI may offer. */
export type DebateStatus =
  | "draft"
  | "setup"
  | "ready"
  | "running"
  | "paused"
  | "waiting"
  | "reviewing"
  | "completed"
  | "cancelled"
  | "error";

/** Stage type of a round. Mirrors moot-court order of speaking. */
export type DebateRoundType =
  | "opening"
  | "argument"
  | "counterargument"
  | "rebuttal"
  | "cross-examination"
  | "closing"
  | "judgment";

/** Lifecycle of a single round. */
export type DebateRoundStatus = "pending" | "active" | "completed" | "skipped";

/** Nature of a transcript entry. Drives ordering and presentation. */
export type DebateEntryKind =
  | "argument"
  | "counterargument"
  | "rebuttal"
  | "response"
  | "objection"
  | "concession"
  | "question"
  | "answer"
  | "judgment"
  | "note";

/** Verification status shared with the legal evidence components. */
export type DebateVerificationStatus = "verified" | "unverified" | "insufficient";

/** How much weight an item of evidence can bear. */
export type DebateEvidenceStrength = "strong" | "moderate" | "weak" | "unverified";

/** Which way an item of evidence cuts. */
export type DebateEvidenceStance = DebateSide | "both";

/** Authority class. `document` covers uploaded pleadings/contracts. */
export type DebateAuthorityKind =
  | "case"
  | "statute"
  | "provision"
  | "guidance"
  | "secondary"
  | "document";

/** Mirrors `ConfidenceIndicator`'s level union. */
export type DebateConfidenceLevel = "high" | "medium" | "low" | "insufficient";

/** Mirrors `ClassificationIndicator`'s union. Gates which models may process it. */
export type DebateClassification = "public" | "internal" | "confidential" | "privileged";

/** Adversarial format being simulated. */
export type DebateFormat =
  | "moot-court"
  | "adversarial-argument"
  | "cross-examination"
  | "case-theory"
  | "red-team";

/** Scoring criteria used by the scoreboard. */
export type DebateCriterionKey =
  | "legal-reasoning"
  | "evidence-quality"
  | "argument-strength"
  | "rebuttal-quality"
  | "citation-quality"
  | "responsiveness"
  | "clarity"
  | "persuasiveness";

/** Activity event classification for the live debate feed. */
export type DebateActivityKind =
  | "agent"
  | "retrieval"
  | "analysis"
  | "tool"
  | "citation-validation"
  | "generation"
  | "system";

/** Lifecycle of a single activity event. */
export type DebateActivityStatus = "queued" | "running" | "completed" | "failed";

/** Who produced an evaluation — never conflated with a legal conclusion. */
export type DebateVerdictBasis = "ai-evaluation" | "user-scoring" | "judicial-assessment";

/* ------------------------------------------------------------------ */
/* Issue & framing                                                     */
/* ------------------------------------------------------------------ */

/** The legal question the debate resolves. */
export interface DebateIssue {
  id?: string;
  /** Headline statement of the controversy. */
  title?: string;
  /** Full legal issue, e.g. "Whether s 14A(b) of the Moneylenders Act 1947 applies…". */
  statement?: string;
  /** The question presented, framed so it can be answered yes or no. */
  questionPresented?: string;
  /** Facts and assumptions the advocates share. */
  background?: string;
  jurisdiction?: string;
  /** Acts, ordinances or practice directions in scope. */
  applicableLaw?: string[];
  /** Classification governing model access. */
  classification?: DebateClassification;
}

/* ------------------------------------------------------------------ */
/* Participants                                                        */
/* ------------------------------------------------------------------ */

/** Per-participant runtime state, kept distinct from debate status. */
export type DebateParticipantStatus =
  | "idle"
  | "thinking"
  | "speaking"
  | "researching"
  | "reviewing"
  | "finished"
  | "offline";

/**
 * A participant in the debate. Human advocates, AI advocates, the judge and
 * observers are all the same entity so the UI never hard-codes one shape.
 */
export interface DebateParticipant {
  id: string;
  name: string;
  type: DebateParticipantType;
  side: DebateSide;
  /** Capacity, e.g. "Opposing Counsel", "Appellate Judge". */
  role?: string;
  /** Institution or firm, for context panels. */
  organisation?: string;
  avatarUrl?: string;
  /** Fallback initials when no avatar is available. */
  initials?: string;
  status?: DebateParticipantStatus;
  /** Current activity line, e.g. "Retrieving authorities on s 14A(b)". */
  activity?: string;
  /** Model identifier for AI participants. */
  model?: string;
  /** Persona/system-instruction summary for AI participants. */
  persona?: string;
  /** Tools the participant may call. Rendered via `AgentTools`. */
  tools?: string[];
  sourcesCount?: number;
  argumentsCount?: number;
  classification?: DebateClassification;
}

/* ------------------------------------------------------------------ */
/* Evidence & authorities                                              */
/* ------------------------------------------------------------------ */

/**
 * A citable legal source. `simulated: true` marks demo content that must be
 * labelled as such in the UI — it is never presented as real authority.
 */
export interface DebateSource {
  id: string;
  title: string;
  kind?: DebateAuthorityKind;
  /** Full citation string, e.g. "[2023] 1 MLJ 123". */
  citation?: string;
  /** Pinpoint, e.g. "s 14A(b)", "at p 456". */
  pinpoint?: string;
  court?: string;
  jurisdiction?: string;
  date?: string;
  url?: string;
  /** The relied-upon passage. */
  excerpt?: string;
  verificationStatus: DebateVerificationStatus;
  /** 0–1. Only meaningful when verified against a real source. */
  confidence?: number;
  /** Set for demo/seed data so it can be badged as simulated. */
  simulated?: boolean;
}

/** Evidence is a source annotated with argumentative weight. */
export interface DebateEvidence extends DebateSource {
  strength: DebateEvidenceStrength;
  /** Which side this evidence supports. */
  stance: DebateEvidenceStance;
  /** Arguments that rely on this evidence. */
  argumentIds?: string[];
}

/** An inline citation inside argument text. */
export interface DebateCitation {
  id: string;
  /** Text shown in the running body, e.g. "Constitution, Art 5(1)". */
  label: string;
  sourceId?: string;
  href?: string;
}

/* ------------------------------------------------------------------ */
/* Arguments                                                           */
/* ------------------------------------------------------------------ */

/**
 * A legal argument. Relationships to other arguments are expressed by
 * `parentId` + `relation`, forming Claim → Counterargument → Rebuttal →
 * Response chains.
 */
export interface DebateArgument {
  id: string;
  /** `argument` opens a claim; the rest respond to one. */
  kind: DebateEntryKind;
  /** Argument this one responds to. */
  parentId?: string;
  side: DebateSide;
  /** Author of the argument. */
  participantId: string;
  roundId?: string;
  /** Headline claim. */
  claim: string;
  /** Ordered reasoning steps supporting the claim. */
  reasoning?: string[];
  /** Evidence relied upon. */
  evidenceIds?: string[];
  /** Sources cited. */
  sourceIds?: string[];
  citations?: DebateCitation[];
  /** 0–1. */
  confidence?: number;
  confidenceLevel?: DebateConfidenceLevel;
  /** Weaknesses conceded or found. */
  weaknesses?: string[];
  /** Set when a participant has conceded the point. */
  conceded?: boolean;
  generatedByAi?: boolean;
  timestamp?: string;
}

/* ------------------------------------------------------------------ */
/* Cross-examination                                                   */
/* ------------------------------------------------------------------ */

/** Where an examination item sits in the Q → A → follow-up → challenge chain. */
export type DebateExaminationStage = "question" | "answer" | "follow-up" | "challenge" | "assessment";

/** One question-and-answer step in cross-examination. */
export interface DebateExaminationItem {
  id: string;
  stage: DebateExaminationStage;
  roundId?: string;
  /** Asker. */
  questionerId: string;
  /** Respondent to the question — omitted for a pending question. */
  answererId?: string;
  question?: string;
  answer?: string;
  /** Evidence put to the witness in support of the question or answer. */
  evidenceIds?: string[];
  /** `strong` | `weak` | `unclear` — set at the `assessment` stage. */
  assessment?: "strong" | "weak" | "unclear";
  assessmentNote?: string;
  timestamp?: string;
}

/* ------------------------------------------------------------------ */
/* Rounds & transcript                                                 */
/* ------------------------------------------------------------------ */

/** One round of the debate. */
export interface DebateRound {
  id: string;
  /** 1-based position in the debate. */
  index: number;
  type: DebateRoundType;
  title?: string;
  /** What this round is meant to establish. */
  brief?: string;
  status: DebateRoundStatus;
  /** Participants expected to speak. */
  participantIds?: string[];
  timeLimitSeconds?: number;
  startedAt?: string;
  completedAt?: string;
}

/**
 * One utterance in the transcript. This is the streaming unit: entries are
 * appended as they are produced so the workspace never re-renders wholesale.
 */
export interface DebateEntry {
  id: string;
  roundId: string;
  participantId: string;
  role: DebateParticipantType;
  side: DebateSide;
  kind: DebateEntryKind;
  /** Body text. Markdown is allowed. */
  content: string;
  timestamp: string;
  /** Argument this entry materialises, if any. */
  argumentId?: string;
  evidenceIds?: string[];
  sources?: DebateSource[];
  citations?: DebateCitation[];
  /** 0–1, for AI-produced entries. */
  confidence?: number;
  confidenceLevel?: DebateConfidenceLevel;
  /** True when produced by a model rather than a human advocate. */
  generatedByAi?: boolean;
  /** True while the entry is still streaming in. */
  streaming?: boolean;
  durationMs?: number;
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

/**
 * A single live event. Only emit these for work that actually happened —
 * speculative activity is a safety violation, not a visual flourish.
 */
export interface DebateActivityEvent {
  id: string;
  kind: DebateActivityKind;
  status: DebateActivityStatus;
  /** Participant or agent the event belongs to. */
  participantId?: string;
  /** e.g. "Retrieving authorities on s 14A(b)". */
  label: string;
  description?: string;
  timestamp: string;
  /** Tool name when `kind` is `tool`. */
  toolName?: string;
  /** Evidence or argument ids this event produced. */
  resultIds?: string[];
  durationMs?: number;
}

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

/** A single criterion's score for one participant. */
export interface DebateCriterionScore {
  criterion: DebateCriterionKey;
  label: string;
  /** 0–100. */
  score: number;
  /** Optional 0–1 confidence in the score itself. */
  confidence?: number;
  /** Why this score was given. */
  rationale?: string;
}

/** Aggregate score for one participant across criteria. */
export interface DebateScoreRow {
  participantId: string;
  /** 0–100 overall. */
  overall: number;
  /** 0–1, confidence in the evaluation. */
  confidence?: number;
  criteria: DebateCriterionScore[];
}

/** One point on the momentum series — the score delta after a round. */
export interface DebateMomentumPoint {
  roundIndex: number;
  roundLabel: string;
  /** Per-participant running total, keyed by participant id. */
  scores: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/* Verdict                                                             */
/* ------------------------------------------------------------------ */

/**
 * The outcome of a debate. `basis` is mandatory: an AI evaluation must never
 * be rendered as a judicial decision or as legal advice.
 */
export interface DebateVerdict {
  /** Winning participant id, or null for a draw / no winner. */
  winnerId: string | null;
  outcome: "proponent" | "opponent" | "draw" | "undecided";
  basis: DebateVerdictBasis;
  /** 0–1 confidence in the verdict itself. */
  confidence: number;
  /** Judge's narrative, in IRAC form where a judge produced it. */
  summary?: string;
  keyReasons?: string[];
  strongestArgumentId?: string;
  weakestArgumentId?: string;
  weaknesses?: string[];
  /** Follow-up actions for the human practitioner. */
  recommendations?: string[];
  /** Set for AI/benchmark verdicts that are not a legal determination. */
  disclaimer?: string;
}

/* ------------------------------------------------------------------ */
/* Debate                                                              */
/* ------------------------------------------------------------------ */

/** The full debate aggregate handed to the shell. */
export interface Debate {
  id: string;
  title: string;
  status: DebateStatus;
  format?: DebateFormat;
  issue: DebateIssue;
  participants: DebateParticipant[];
  rounds: DebateRound[];
  entries: DebateEntry[];
  arguments?: DebateArgument[];
  evidence?: DebateEvidence[];
  sources?: DebateSource[];
  examinations?: DebateExaminationItem[];
  activity?: DebateActivityEvent[];
  scores?: DebateScoreRow[];
  momentum?: DebateMomentumPoint[];
  verdict?: DebateVerdict;
  criteria?: DebateCriterionKey[];
  createdAt?: string;
  updatedAt?: string;
  /** Why the debate is in `paused` / `waiting` / `error`. */
  statusMessage?: string;
  /** True when the whole debate is demo/seed content. */
  simulated?: boolean;
}

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */

/** Everything `DebateSetup` collects before a debate can start. */
export interface DebateSetupValues {
  title: string;
  issue: DebateIssue;
  format: DebateFormat;
  /** Human advocates first, then AI agents — order preserved per side. */
  participants: DebateParticipant[];
  /** Ids of attachments promoted to evidence. */
  evidenceIds: string[];
  rounds: number;
  timeLimitSeconds: number;
  criteria: DebateCriterionKey[];
  /** Whether a judge participant is included. */
  includeJudge: boolean;
  /** Free-text house rules shown to advocates. */
  rules?: string;
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

/** Canonical criterion labels, kept in one place so scoring stays consistent. */
export const DEBATE_CRITERIA: Record<DebateCriterionKey, string> = {
  "legal-reasoning": "Legal Reasoning",
  "evidence-quality": "Evidence Quality",
  "argument-strength": "Argument Strength",
  "rebuttal-quality": "Rebuttal Quality",
  "citation-quality": "Citation Quality",
  responsiveness: "Responsiveness",
  clarity: "Clarity",
  persuasiveness: "Persuasiveness",
};

/** Round titles used by `DebateSetup` when building the round plan. */
export const DEBATE_ROUND_TYPES: readonly DebateRoundType[] = [
  "opening",
  "argument",
  "counterargument",
  "rebuttal",
  "cross-examination",
  "closing",
  "judgment",
] as const;

/** Human-readable label for a round type. */
export const DEBATE_ROUND_LABELS: Record<DebateRoundType, string> = {
  opening: "Opening Argument",
  argument: "Argument",
  counterargument: "Counterargument",
  rebuttal: "Rebuttal",
  "cross-examination": "Cross Examination",
  closing: "Closing Argument",
  judgment: "Judgement",
};

/** Human-readable label for an entry kind. */
export const DEBATE_ENTRY_LABELS: Record<DebateEntryKind, string> = {
  argument: "Argument",
  counterargument: "Counterargument",
  rebuttal: "Rebuttal",
  response: "Response",
  objection: "Objection",
  concession: "Concession",
  question: "Question",
  answer: "Answer",
  judgment: "Judgement",
  note: "Note",
};

/** Label for a side, used in badges and headings. */
export const DEBATE_SIDE_LABELS: Record<DebateSide, string> = {
  proponent: "Proponent",
  opponent: "Opponent",
  neutral: "Bench",
};

/** Label for a participant type. */
export const DEBATE_PARTICIPANT_LABELS: Record<DebateParticipantType, string> = {
  human: "Human",
  ai: "AI Agent",
  judge: "Judge",
  observer: "Observer",
};

/** Label for debate status. */
export const DEBATE_STATUS_LABELS: Record<DebateStatus, string> = {
  draft: "Draft",
  setup: "Setup",
  ready: "Ready",
  running: "Running",
  paused: "Paused",
  waiting: "Waiting",
  reviewing: "Reviewing",
  completed: "Completed",
  cancelled: "Cancelled",
  error: "Error",
};

/** Jurisdictions offered in setup. Malaysian practice is the default. */
export const DEBATE_JURISDICTIONS: readonly string[] = [
  "Malaysia — Federal Court",
  "Malaysia — Court of Appeal",
  "Malaysia — Federal Court of Appeal",
  "Malaysia — High Court in Sabah and Sarawak",
  "Malaysia — High Court in Malaya",
  "Malaysia — Court of Appeal (Criminal)",
  "Malaysia — Federal Territory Court",
  "Malaysia — Sharia Court (Federal Territories)",
  "Malaysia — Tribunal",
] as const;

/* ------------------------------------------------------------------ */
/* Legacy turn shape                                                   */
/* ------------------------------------------------------------------ */

/**
 * Pre-participant transcript shape. Kept so callers that persisted the older
 * `{ role, roundNum, argument }` records keep compiling; `DebateTranscript`
 * converts these into full `DebateEntry` records internally.
 */
export type DebateRole = "proponent" | "opponent" | "judge" | "observer";

export interface DebateTurn {
  id: string;
  role: DebateRole;
  roundNum: number;
  argument: string;
  score?: number;
  timestamp: string;
}

/** Legacy two-sided totals. New scoring uses `DebateScoreRow[]`. */
export interface DebateScores {
  applicant: number;
  respondent: number;
}

/* ------------------------------------------------------------------ */
/* Legacy → domain migration                                           */
/* ------------------------------------------------------------------ */

/** Maps a legacy role onto a side. */
export function sideForRole(role: DebateRole): DebateSide {
  switch (role) {
    case "proponent":
      return "proponent";
    case "opponent":
      return "opponent";
    default:
      return "neutral";
  }
}

/** Maps a legacy role onto a participant type. */
export function participantTypeForRole(role: DebateRole): DebateParticipantType {
  return role === "judge" ? "judge" : role === "observer" ? "observer" : "human";
}

/**
 * Normalises legacy turns into transcript entries. Arguments are folded into
 * the entry that carries them so the transcript stays a single flat stream.
 */
export function turnsToEntries(turns: DebateTurn[]): DebateEntry[] {
  return turns.map((turn) => {
    const isBench = turn.role === "judge" || turn.role === "observer";
    const roundId = `round-${turn.roundNum}`;
    const entry: DebateEntry = {
      id: turn.id,
      roundId,
      participantId: turn.role,
      role: participantTypeForRole(turn.role),
      side: sideForRole(turn.role),
      kind: isBench ? "judgment" : turn.roundNum <= 1 ? "argument" : "counterargument",
      content: turn.argument,
      timestamp: turn.timestamp,
    };
    return entry;
  });
}
