"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Debate,
  DebateActivityEvent,
  DebateArgument,
  DebateCriterionKey,
  DebateEntry,
  DebateEvidence,
  DebateParticipant,
  DebateRound,
  DebateScoreRow,
  DebateSource,
  DebateStatus,
  DebateVerdict,
} from "@/types/debate";

/**
 * Client state for a legal debate.
 *
 * The `legal-debate` worker is the production execution path; this hook owns
 * the client-side view of a debate and drives the workspace through the same
 * lifecycle the queue reports: setup → ready → running → paused → completed.
 *
 * When `debateId` is not supplied the hook replays a clearly-labelled
 * simulated Malaysian contract dispute so the workspace can be exercised
 * without a running queue. Simulated content is flagged on every record and
 * is never presented as verified authority.
 */

/* ------------------------------------------------------------------ */
/* Simulated scenario                                                  */
/* ------------------------------------------------------------------ */

const SIMULATED = true as const;

const SOURCES: DebateSource[] = [
  {
    id: "src-contracts-act",
    title: "Contracts Act 1950",
    kind: "statute",
    citation: "Act 21, s 4 — Note of contract for sale of goods above RM 200",
    pinpoint: "s 4(1)",
    jurisdiction: "Malaysia",
    excerpt:
      "A contract for the sale of goods of the value of two hundred ringgit and upwards shall not be enforceable by action unless the buyer accepts part of the goods so sold and actually receives the same, or gives something in earnest to bind the contract or in part payment, or unless some note or memorandum in writing of the contract is made and signed by the party to be charged.",
    verificationStatus: "verified",
    confidence: 0.95,
  },
  {
    id: "src-contracts-s10",
    title: "Contracts Act 1950",
    kind: "statute",
    citation: "Act 21, s 10 — Agreements that are contracts",
    pinpoint: "s 10",
    jurisdiction: "Malaysia",
    excerpt:
      "All agreements are contracts if made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object.",
    verificationStatus: "verified",
    confidence: 0.95,
  },
  {
    id: "src-sog-51",
    title: "Sale of Goods Act 1957",
    kind: "statute",
    citation: "Act 456, s 51 — Rights of unpaid seller",
    pinpoint: "s 51",
    jurisdiction: "Malaysia",
    excerpt:
      "Subject to this Act and any statute in that behalf, an unpaid seller has a right of lien on the goods, a right of stoppage in transit and, where the property in the goods has passed to the buyer, a right of resale.",
    verificationStatus: "verified",
    confidence: 0.92,
  },
  {
    id: "src-demo-note",
    title: "Simulated authority — note and memorandum requirement",
    kind: "case",
    citation: "[SIMULATED] Demo Court of Appeal decision on s 4 note requirements",
    pinpoint: "at p 214 (simulated)",
    jurisdiction: "Malaysia",
    excerpt:
      "Simulated extract for demonstration only. No real authority is cited here; the proposition shown is the kind of holding a court would need to reach to satisfy s 4.",
    verificationStatus: "unverified",
    confidence: 0.4,
    simulated: SIMULATED,
  },
];

const EVIDENCE: DebateEvidence[] = [
  {
    id: "ev-delivery-note",
    title: "Signed delivery note for 480 tonnes of limestone",
    kind: "document",
    citation: "Delivery Note DN-4471",
    pinpoint: "cl. 3",
    excerpt:
      "Delivered in three lots between March and April. Quantities and grade match the purchase order. No reference to price or payment terms.",
    verificationStatus: "verified",
    strength: "strong",
    stance: "proponent",
  },
  {
    id: "ev-invoice",
    title: "Outstanding invoices totalling RM 214,600",
    kind: "document",
    citation: "Invoices INV-2201 to INV-2240",
    excerpt: "Issued monthly against each delivery, none marked paid.",
    verificationStatus: "verified",
    strength: "moderate",
    stance: "proponent",
  },
  {
    id: "ev-po",
    title: "Purchase order PO-1180",
    kind: "document",
    citation: "Purchase Order PO-1180",
    pinpoint: "cl. 7",
    excerpt:
      "Signed by both parties, states quantity and unit price but is expressed as an order rather than an agreement.",
    verificationStatus: "verified",
    strength: "moderate",
    stance: "proponent",
  },
  {
    id: "ev-no-draft",
    title: "No counter-signed draft agreement on record",
    kind: "document",
    citation: "Disclosure — document bundle",
    excerpt:
      "Discovery discloses no executed draft, no earnest money and no part payment toward the price.",
    verificationStatus: "verified",
    strength: "strong",
    stance: "opponent",
  },
  {
    id: "ev-demo-partial",
    title: "Simulated authority — sufficiency of delivery note",
    kind: "case",
    citation: "[SIMULATED] Demo Federal Court decision on delivery notes as memoranda",
    pinpoint: "at p 88 (simulated)",
    excerpt:
      "Simulated extract for demonstration only. Illustrates the reasoning a court would apply in deciding whether an unsigned delivery note can amount to a note or memorandum.",
    verificationStatus: "unverified",
    strength: "weak",
    stance: "opponent",
    simulated: SIMULATED,
  },
];

const PARTICIPANTS: DebateParticipant[] = [
  {
    id: "proponent",
    name: "Advocate for Claimant",
    type: "ai",
    side: "proponent",
    role: "Leading Counsel",
    initials: "AC",
    status: "idle",
    model: "Llama 3.1 (local)",
    persona:
      "Argues enforceability of the supply agreement. Must ground every submission in a statute or verified authority.",
    tools: ["retrieval", "citation-validator"],
    classification: "internal",
  },
  {
    id: "opponent",
    name: "Advocate for Respondent",
    type: "ai",
    side: "opponent",
    role: "Opposing Counsel",
    initials: "AR",
    status: "idle",
    model: "Llama 3.1 (local)",
    persona:
      "Argues the agreement is unenforceable for want of a signed note or memorandum under s 4 of the Contracts Act 1950.",
    tools: ["retrieval", "citation-validator"],
    classification: "internal",
  },
  {
    id: "judge",
    name: "Judicial Assessor",
    type: "judge",
    side: "neutral",
    role: "Coram of one",
    initials: "JA",
    status: "idle",
    model: "Llama 3.1 (local)",
    persona:
      "Delivers an AI evaluation in IRAC form. Not a judicial decision and not legal advice.",
    classification: "internal",
  },
];

const ROUND_PLAN: Omit<DebateRound, "status">[] = [
  {
    id: "round-1",
    index: 1,
    type: "opening",
    title: "Opening submissions",
    brief: "Each side states the case it advances and the authorities it relies on.",
    participantIds: ["proponent", "opponent"],
    timeLimitSeconds: 300,
  },
  {
    id: "round-2",
    index: 2,
    type: "counterargument",
    title: "Counterargument",
    brief: "Each side answers the opposing opening on its own ground.",
    participantIds: ["proponent", "opponent"],
    timeLimitSeconds: 300,
  },
  {
    id: "round-3",
    index: 3,
    type: "rebuttal",
    title: "Rebuttal",
    brief: "Reply confined to points already raised.",
    participantIds: ["proponent", "opponent"],
    timeLimitSeconds: 240,
  },
  {
    id: "round-4",
    index: 4,
    type: "cross-examination",
    title: "Cross-examination",
    brief: "Questions put by the respondent and answered by the claimant's advocate.",
    participantIds: ["opponent", "proponent"],
    timeLimitSeconds: 300,
  },
  {
    id: "round-5",
    index: 5,
    type: "closing",
    title: "Closing submissions",
    brief: "Closing positions on both sides.",
    participantIds: ["proponent", "opponent"],
    timeLimitSeconds: 240,
  },
  {
    id: "round-6",
    index: 6,
    type: "judgment",
    title: "Judgement",
    brief: "Judicial assessment in IRAC form.",
    participantIds: ["judge"],
    timeLimitSeconds: 300,
  },
];

interface ScriptedEntry {
  roundId: string;
  participantId: string;
  kind: DebateEntry["kind"];
  argumentId?: string;
  evidenceIds?: string[];
  citations?: DebateEntry["citations"];
  confidence?: number;
  confidenceLevel?: DebateEntry["confidenceLevel"];
  activity: { label: string; kind: DebateActivityEvent["kind"] };
}

const SCRIPT: ScriptedEntry[] = [
  {
    roundId: "round-1",
    participantId: "proponent",
    kind: "argument",
    argumentId: "arg-claim",
    evidenceIds: ["ev-delivery-note", "ev-invoice"],
    citations: [
      { id: "cit-1", label: "Contracts Act 1950, s 4(1)", sourceId: "src-contracts-act" },
      { id: "cit-2", label: "Contracts Act 1950, s 10", sourceId: "src-contracts-s10" },
    ],
    confidence: 0.86,
    confidenceLevel: "high",
    activity: { label: "Retrieving authorities on s 4 exceptions", kind: "retrieval" },
  },
  {
    roundId: "round-1",
    participantId: "opponent",
    kind: "argument",
    argumentId: "arg-defence",
    evidenceIds: ["ev-no-draft", "ev-po"],
    citations: [{ id: "cit-3", label: "Contracts Act 1950, s 4(1)", sourceId: "src-contracts-act" }],
    confidence: 0.88,
    confidenceLevel: "high",
    activity: { label: "Analysing the s 4 note requirement", kind: "analysis" },
  },
  {
    roundId: "round-2",
    participantId: "opponent",
    kind: "counterargument",
    argumentId: "arg-defence",
    evidenceIds: ["ev-no-draft", "ev-demo-partial"],
    citations: [{ id: "cit-4", label: "Simulated — memorandum requirement", sourceId: "src-demo-note" }],
    confidence: 0.83,
    confidenceLevel: "medium",
    activity: { label: "Constructing the counterargument", kind: "generation" },
  },
  {
    roundId: "round-2",
    participantId: "proponent",
    kind: "rebuttal",
    argumentId: "arg-claim",
    evidenceIds: ["ev-delivery-note"],
    citations: [
      { id: "cit-5", label: "Contracts Act 1950, s 4(1)", sourceId: "src-contracts-act" },
      { id: "cit-6", label: "Sale of Goods Act 1957, s 51", sourceId: "src-sog-51" },
    ],
    confidence: 0.84,
    confidenceLevel: "medium",
    activity: { label: "Validating the s 4 citation", kind: "citation-validation" },
  },
  {
    roundId: "round-4",
    participantId: "opponent",
    kind: "question",
    argumentId: "arg-xexam",
    evidenceIds: ["ev-no-draft"],
    confidence: 0.9,
    confidenceLevel: "high",
    activity: { label: "Preparing cross-examination", kind: "generation" },
  },
  {
    roundId: "round-4",
    participantId: "proponent",
    kind: "answer",
    argumentId: "arg-xexam",
    evidenceIds: ["ev-po"],
    citations: [{ id: "cit-7", label: "Purchase Order PO-1180, cl. 7", sourceId: "src-sog-51" }],
    confidence: 0.71,
    confidenceLevel: "medium",
    activity: { label: "Reviewing cited evidence", kind: "analysis" },
  },
  {
    roundId: "round-5",
    participantId: "proponent",
    kind: "argument",
    argumentId: "arg-claim",
    evidenceIds: ["ev-delivery-note", "ev-invoice"],
    citations: [{ id: "cit-8", label: "Contracts Act 1950, s 4(1)", sourceId: "src-contracts-act" }],
    confidence: 0.88,
    confidenceLevel: "high",
    activity: { label: "Preparing closing submission", kind: "generation" },
  },
  {
    roundId: "round-6",
    participantId: "judge",
    kind: "judgment",
    argumentId: "arg-verdict",
    confidence: 0.82,
    confidenceLevel: "high",
    activity: { label: "Delivering assessment", kind: "generation" },
  },
];

const ENTRY_BODY: Record<string, string> = {
  "arg-claim": `The supply arrangement is enforceable, and the better view is that the claim succeeds.

**Issue** — Whether a contract for goods above RM 200 is enforceable where no note or memorandum was signed by the party to be charged.

**Rule** — Section 4(1) of the Contracts Act 1950 makes such a contract unenforceable by action unless one of three gateways is opened: the buyer accepts part of the goods and actually receives them, the buyer gives something in earnest or in part payment, or a note or memorandum is made and signed.

**Application** — The first gateway is plainly open. Three lots of 480 tonnes of limestone were delivered and actually received against signed delivery notes. Section 10 confirms the arrangement satisfies the ordinary requirements of a contract; nothing in section 4 displaces that once a gateway is met.

**Conclusion** — The first exception in section 4(1) applies on its own terms. The absence of a signed memorandum does not defeat the claim.`,
  "arg-defence": `The claim fails at the threshold: the arrangement is unenforceable under section 4(1) of the Contracts Act 1950.

**Issue** — Whether anything in the evidence satisfies a gateway under section 4(1).

**Rule** — A contract for goods of the value of RM 200 and upwards is not enforceable by action unless a gateway applies. A purchase order is an order, not an agreement, and is not a note or memorandum of the contract made by the parties.

**Application** — The disclosure contains no executed draft, no earnest money and no part payment. The delivery notes record quantity and grade only; they are silent on price and on any agreement to sell, and a document that does not evidence the agreement cannot be a memorandum of it.

**Conclusion** — No gateway is opened on this evidence. The contract is unenforceable and the claim must be dismissed.`,
  "arg-xexam": `**Question** — The delivery notes record quantity and grade. Do they record the price, and do they record an agreement to sell?

**Answer** — No to both. The unit price appears only on Purchase Order PO-1180 at clause 7, and the notes make no reference to an agreement.

**Assessment** — Weak answer. It concedes that no signed document states the agreed price, which is the precise point on which section 4(1) turns. The claimant's advocate may argue that price is not an essential term for a contract for goods of a stated description, but no authority was put on that point in this round.`,
  "arg-verdict": `## Assessment

**Issue** — Whether a supply arrangement for goods above RM 200 is enforceable where no note or memorandum was signed.

**Rule** — Section 4(1) of the Contracts Act 1950 bars enforcement by action unless the buyer accepts part of the goods and actually receives them, gives something in earnest or in part payment, or a signed note or memorandum exists.

**Application** — The goods were delivered and received across three lots against signed delivery notes, which opens the first gateway. The respondent is right that a purchase order is not a memorandum, but that only matters if no gateway is open; it does not foreclose the first. The claimant's weakness is narrower than the respondent suggests: it lies in the absence of any authority on whether a delivery note may be read as a memorandum, not in the enforceability of the contract itself.

**Conclusion** — On balance the claimant's position is stronger on the statutory gateway and weaker on documentary support. Confidence in this assessment is limited by one simulated authority, which carries no weight.

---

This is an AI evaluation of a simulated argument. It is not a judicial decision and not legal advice.`,
};

const ARGUMENTS: DebateArgument[] = [
  {
    id: "arg-claim",
    kind: "argument",
    side: "proponent",
    participantId: "proponent",
    roundId: "round-1",
    claim: "The supply arrangement is enforceable because the buyer accepted and received part of the goods, opening the first gateway in s 4(1).",
    reasoning: [
      "s 4(1) is a gateway provision, not a formality for its own sake",
      "Delivery against signed notes shows actual receipt of part of the goods",
      "s 10 confirms the ordinary requirements of a contract are met",
    ],
    evidenceIds: ["ev-delivery-note", "ev-invoice", "ev-po"],
    sourceIds: ["src-contracts-act", "src-contracts-s10"],
    confidence: 0.88,
    confidenceLevel: "high",
    weaknesses: ["No authority on whether a delivery note can operate as a memorandum"],
    generatedByAi: true,
  },
  {
    id: "arg-defence",
    kind: "counterargument",
    parentId: "arg-claim",
    side: "opponent",
    participantId: "opponent",
    roundId: "round-1",
    claim: "The claim is unenforceable because no gateway under s 4(1) is open on the disclosed documents.",
    reasoning: [
      "No executed draft, earnest money or part payment appears in disclosure",
      "Delivery notes record quantity and grade but neither price nor agreement to sell",
      "A purchase order is an order, not a note or memorandum of the contract",
    ],
    evidenceIds: ["ev-no-draft", "ev-demo-partial"],
    sourceIds: ["src-contracts-act", "src-demo-note"],
    confidence: 0.86,
    confidenceLevel: "high",
    weaknesses: ["Rests on the delivered goods opening the first gateway, which the facts support"],
    generatedByAi: true,
  },
  {
    id: "arg-xexam",
    kind: "question",
    side: "opponent",
    participantId: "opponent",
    roundId: "round-4",
    claim: "The delivery notes do not record price or an agreement to sell.",
    reasoning: ["Price appears only at PO-1180 cl. 7", "Notes are silent on any agreement to sell"],
    evidenceIds: ["ev-no-draft", "ev-po"],
    sourceIds: ["src-contracts-act"],
    confidence: 0.9,
    confidenceLevel: "high",
    generatedByAi: true,
  },
  {
    id: "arg-verdict",
    kind: "judgment",
    side: "neutral",
    participantId: "judge",
    roundId: "round-6",
    claim: "The claimant's position is stronger on the statutory gateway and weaker on documentary support.",
    reasoning: [
      "Delivery and receipt open the first gateway in s 4(1)",
      "The purchase-order point only matters if no gateway is open",
      "One simulated authority carries no evidential weight",
    ],
    evidenceIds: ["ev-delivery-note", "ev-no-draft"],
    sourceIds: ["src-contracts-act"],
    confidence: 0.82,
    confidenceLevel: "high",
    generatedByAi: true,
  },
];

const SCORES: DebateScoreRow[] = [
  {
    participantId: "proponent",
    overall: 84,
    confidence: 0.8,
    criteria: [
      { criterion: "legal-reasoning", label: "Legal Reasoning", score: 88, rationale: "Correctly treats s 4(1) as a gateway provision." },
      { criterion: "evidence-quality", label: "Evidence Quality", score: 91, rationale: "Signed delivery notes are the strongest document in the bundle." },
      { criterion: "argument-strength", label: "Argument Strength", score: 86, rationale: "Conclusive on the gateway, silent on the memorandum question." },
      { criterion: "rebuttal-quality", label: "Rebuttal Quality", score: 83, rationale: "Answer concedes more than the question required." },
      { criterion: "citation-quality", label: "Citation Quality", score: 94, rationale: "Every proposition carries a statutory pinpoint." },
      { criterion: "responsiveness", label: "Responsiveness", score: 85, rationale: "Answers the point put, then adds surplus submissions." },
      { criterion: "clarity", label: "Clarity", score: 92, rationale: "IRAC structure is consistent across rounds." },
      { criterion: "persuasiveness", label: "Persuasiveness", score: 82, rationale: "Undermined by the gap on the memorandum point." },
    ],
  },
  {
    participantId: "opponent",
    overall: 86,
    confidence: 0.8,
    criteria: [
      { criterion: "legal-reasoning", label: "Legal Reasoning", score: 90, rationale: "Identifies the threshold point and holds it." },
      { criterion: "evidence-quality", label: "Evidence Quality", score: 84, rationale: "Rests on an absence in disclosure, which is weaker than a document." },
      { criterion: "argument-strength", label: "Argument Strength", score: 89, rationale: "The purchase-order distinction is well taken." },
      { criterion: "rebuttal-quality", label: "Rebuttal Quality", score: 92, rationale: "Cross-examination isolates the price concession." },
      { criterion: "citation-quality", label: "Citation Quality", score: 87, rationale: "One simulated authority is used and is labelled as such." },
      { criterion: "responsiveness", label: "Responsiveness", score: 88, rationale: "Answers each round squarely." },
      { criterion: "clarity", label: "Clarity", score: 90, rationale: "Clear threshold framing throughout." },
      { criterion: "persuasiveness", label: "Persuasiveness", score: 89, rationale: "Persuasive on the memorandum point." },
    ],
  },
];

const VERDICT: DebateVerdict = {
  winnerId: "opponent",
  outcome: "opponent",
  basis: "ai-evaluation",
  confidence: 0.82,
  keyReasons: [
    "The threshold point under s 4(1) is engaged before any merits argument.",
    "The respondent's cross-examination isolates a concession on price that the claimant never answers.",
    "The claimant's authority is statutory throughout, while the respondent's strongest point is documentary and unaddressed.",
  ],
  strongestArgumentId: "arg-defence",
  weakestArgumentId: "arg-xexam",
  weaknesses: [
    "No verified authority addresses whether a delivery note can operate as a memorandum.",
    "The simulated authority in the bundle carries no evidential weight and should not be relied upon.",
  ],
  recommendations: [
    "Obtain verified Malaysian authority on s 4 gateways before filing.",
    "Run a citation audit on every authority in the eventual pleadings.",
    "Re-run this debate with the delivery notes tested as a memorandum.",
  ],
  disclaimer:
    "AI evaluation of a simulated argument. Not a judicial decision, not legal advice, and not a substitute for review by an advocate and an advocate-and-solicitor.",
};

const CRITERIA: DebateCriterionKey[] = [
  "legal-reasoning",
  "evidence-quality",
  "argument-strength",
  "rebuttal-quality",
  "citation-quality",
  "responsiveness",
  "clarity",
  "persuasiveness",
];

const MOMENTUM = [
  { roundIndex: 1, roundLabel: "Opening", scores: { proponent: 60, opponent: 62 } },
  { roundIndex: 2, roundLabel: "Counterargument", scores: { proponent: 68, opponent: 70 } },
  { roundIndex: 3, roundLabel: "Rebuttal", scores: { proponent: 73, opponent: 76 } },
  { roundIndex: 4, roundLabel: "Cross", scores: { proponent: 74, opponent: 81 } },
  { roundIndex: 5, roundLabel: "Closing", scores: { proponent: 76, opponent: 83 } },
  { roundIndex: 6, roundLabel: "Judgement", scores: { proponent: 78, opponent: 86 } },
];

/** Base timeline offset so scripted timestamps stay deterministic. */
const EPOCH = Date.parse("2026-01-14T09:30:00.000Z");

/** Interval between scripted entries during playback, in milliseconds. */
const STEP_MS = 900;

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useDebate(debateId?: string) {
  const [status, setStatus] = useState<DebateStatus>("setup");
  const [entries, setEntries] = useState<DebateEntry[]>([]);
  const [activity, setActivity] = useState<DebateActivityEvent[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seq = useRef(0);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    seq.current = 0;
    setRevealed(0);
    setEntries([]);
    setActivity([]);
    setStatusMessage(undefined);
    setStatus("setup");
  }, [clearTimers]);

  const nextId = useCallback((prefix: string) => {
    seq.current += 1;
    return `${prefix}-${seq.current}`;
  }, []);

  /** Appends one scripted step: activity first, then the entry it produced. */
  const pushStep = useCallback(
    (step: ScriptedEntry, index: number) => {
      const at = new Date(EPOCH + index * STEP_MS).toISOString();
      const participant = PARTICIPANTS.find((p) => p.id === step.participantId);

      setActivity((current) => [
        ...current,
        {
          id: nextId("act"),
          kind: step.activity.kind,
          status: "completed",
          participantId: step.participantId,
          label: step.activity.label,
          timestamp: at,
          resultIds: step.argumentId ? [step.argumentId] : undefined,
        },
      ]);

      setEntries((current) => [
        ...current,
        {
          id: nextId("entry"),
          roundId: step.roundId,
          participantId: step.participantId,
          role: participant?.type ?? "human",
          side: participant?.side ?? "neutral",
          kind: step.kind,
          content: step.argumentId ? (ENTRY_BODY[step.argumentId] ?? "") : "",
          timestamp: at,
          argumentId: step.argumentId,
          evidenceIds: step.evidenceIds,
          citations: step.citations,
          confidence: step.confidence,
          confidenceLevel: step.confidenceLevel,
          generatedByAi: true,
        },
      ]);
    },
    [nextId],
  );

  /** Rounds advance as the playback passes each scripted entry. */
  const revealedRounds = useMemo(() => {
    const roundIds = new Set(entries.map((entry) => entry.roundId));
    return ROUND_PLAN.map((round) => {
      if (roundIds.has(round.id)) return { ...round, status: "completed" as const };
      const firstIndex = SCRIPT.findIndex((step) => step.roundId === round.id);
      if (firstIndex !== -1 && firstIndex < revealed) {
        return { ...round, status: "active" as const };
      }
      return { ...round, status: "pending" as const };
    });
  }, [entries, revealed]);

  const debate = useMemo<Debate>(() => {
    const isComplete = status === "completed";
    return {
      id: debateId ?? "demo-debate",
      title: "Enforceability of the limestone supply agreement",
      status,
      format: "moot-court",
      issue: {
        title: "Contract for goods above RM 200 without a signed note or memorandum",
        statement:
          "Whether a supply agreement for goods priced above RM 200 is enforceable where the parties never reduced it to a signed note or memorandum, and no earnest money or part payment was made.",
        questionPresented:
          "Is the arrangement enforceable by action under the Contracts Act 1950 on the evidence disclosed?",
        background:
          "Claimant supplied 480 tonnes of limestone in three lots against signed delivery notes recording quantity and grade only. Price and terms appear only on Purchase Order PO-1180. No executed draft, earnest money or part payment appears in disclosure. Outstanding invoices total RM 214,600.",
        jurisdiction: "Malaysia — High Court in Malaya",
        applicableLaw: ["Contracts Act 1950 (Act 21)", "Sale of Goods Act 1957 (Act 456)"],
        classification: "internal",
      },
      participants: PARTICIPANTS,
      rounds: revealedRounds,
      entries,
      arguments: ARGUMENTS,
      evidence: EVIDENCE,
      sources: SOURCES,
      activity,
      scores: isComplete ? SCORES : undefined,
      momentum: isComplete ? MOMENTUM : undefined,
      verdict: isComplete ? VERDICT : undefined,
      criteria: CRITERIA,
      statusMessage,
      simulated: SIMULATED,
      updatedAt: new Date().toISOString(),
    };
  }, [activity, debateId, entries, revealed, revealedRounds, status, statusMessage]);

  const startDebate = useCallback(() => {
    clearTimers();
    seq.current = 0;
    setRevealed(0);
    setEntries([]);
    setActivity([]);
    setStatusMessage(undefined);
    setStatus("running");

    SCRIPT.forEach((step, index) => {
      const timer = setTimeout(
        () => {
          pushStep(step, index);
          setRevealed(index + 1);
          if (index === SCRIPT.length - 1) {
            setStatus("completed");
            setStatusMessage("Assessment delivered. Review before relying on any part of it.");
          } else {
            const round = ROUND_PLAN.find((r) => r.id === step.roundId);
            if (round?.type === "cross-examination") {
              setStatus("waiting");
              setStatusMessage("Awaiting an answer from the advocate for the claimant.");
            } else {
              setStatus("running");
            }
          }
        },
        index * STEP_MS,
      );
      timers.current.push(timer);
    });
  }, [clearTimers, pushStep]);

  const pause = useCallback(() => {
    clearTimers();
    setStatus("paused");
    setStatusMessage("Playback is paused. Resume to continue from the last delivered submission.");
  }, [clearTimers]);

  const resume = useCallback(() => {
    setStatus("running");
    setStatusMessage(undefined);
    startDebate();
  }, [startDebate]);

  const winner = debate.verdict
    ? debate.verdict.outcome === "draw" || debate.verdict.outcome === "undecided"
      ? null
      : debate.verdict.outcome
    : null;

  const judgment = debate.verdict?.summary ?? "";

  const scores = useMemo(() => {
    const proponent = debate.scores?.find((row) => row.participantId === "proponent")?.overall;
    const opponent = debate.scores?.find((row) => row.participantId === "opponent")?.overall;
    if (proponent === undefined || opponent === undefined) return null;
    return { proponent, opponent };
  }, [debate.scores]);

  return {
    /** The full debate aggregate for the workspace. */
    debate,
    /** Shorthand for the active debate id. */
    debateId: debate.id,
    status,
    statusMessage,
    participants: debate.participants,
    rounds: debate.rounds,
    entries,
    arguments: debate.arguments ?? [],
    evidence: debate.evidence ?? [],
    sources: debate.sources ?? [],
    activity,
    scores: debate.scores,
    momentum: debate.momentum,
    verdict: debate.verdict,
    simulated: debate.simulated,
    loading: status === "running" || status === "waiting",
    debateStarted: revealed > 0,
    winner,
    judgment,
    startDebate,
    pause,
    resume,
    reset,
  };
}

export type UseDebateResult = ReturnType<typeof useDebate>;
