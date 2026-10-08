import type {
  DocumentAnalysis,
  Finding,
  FindingKind,
  Severity,
} from "@/types/lawmate";

/**
 * Deterministic document-analysis engine.
 *
 * Every finding returned here is derived from the *actual* text of the
 * document (the `content` field from `documents.getById`) via pattern
 * matching — nothing is fabricated. Each finding carries a real source
 * excerpt so a lawyer can verify it (AGENTS.md safety rule 8: "always
 * identify source evidence when available"). Because no LLM inference is
 * performed, the result is labelled rule-based and HITL level 1
 * (recommendation) — a lawyer must review before it is relied upon.
 */

export interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  docType: string;
  status: string;
  version: number;
  caseNumber?: string | null;
  court?: string | null;
  jurisdiction?: string | null;
  tags?: string[];
  parties?: {
    plaintiff?: string;
    defendant?: string;
    petitioner?: string;
    respondent?: string;
    appellant?: string;
    appellee?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
}

export interface AnalysisProvenance {
  source: string;
  sourceType: string;
  method: string;
  dataClass: string;
  hitlLevel: number;
  hitlLabel: string;
  confidence: number;
  verified: boolean;
  note: string;
}

export interface AnalysisStats {
  wordCount: number;
  charCount: number;
  clauseCount: number;
  sectionCount: number;
  estimatedPages: number;
}

export interface AnalyzedDocument extends DocumentAnalysis {
  provenance: AnalysisProvenance;
  stats: AnalysisStats;
  riskScore: number; // 0-100, derived from real findings
  qualityScore: number; // 0-100, derived from real findings
  insufficient: boolean; // true when content is too thin to analyse
}

// ─── Severity + scoring ────────────────────────────────────────────────────

const SEVERITY_WEIGHT: Record<Severity, number> = {
  high: 25,
  medium: 12,
  low: 5,
  info: 0,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const MONTHS =
  "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)";

const ISO_DATE = /\b(19|20)\d{2}-\d{2}-\d{2}\b/g;
const NUM_DATE = /\b(0?[1-9]|[12]\d|3[01])[\/\-.](0?[1-9]|1[0-2])[\/\-.]((?:19|20)\d{2})\b/g;
const WORD_DATE = new RegExp(
  `\\b(0?[1-9]|[12]\\d|3[01])\\s+${MONTHS}\\s+((?:19|20)\\d{2})\\b`,
  "g"
);

/** Pull the sentence containing `index` so a finding can quote its source. */
function sentenceAround(text: string, index: number, maxLen = 220): string {
  const start = text.lastIndexOf(".", index - 40) + 1;
  const backStart =
    start > index ? Math.max(0, index - 60) : Math.max(0, start);
  const end = text.indexOf(".", index + 40);
  const backEnd = end === -1 ? text.length : Math.min(text.length, end + 1);
  let slice = text.slice(backStart, backEnd).replace(/\s+/g, " ").trim();
  if (slice.length > maxLen) slice = `${slice.slice(0, maxLen - 1)}…`;
  return slice;
}

function firstExcerpt(text: string, pattern: RegExp): string | undefined {
  const m = pattern.exec(text);
  if (!m) return undefined;
  return sentenceAround(text, m.index);
}

function collectDates(content: string): string[] {
  const out = new Set<string>();
  for (const re of [ISO_DATE, NUM_DATE, WORD_DATE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      out.add(m[0]);
    }
  }
  return Array.from(out).slice(0, 12);
}

function countClauses(content: string) {
  const named = (content.match(/^\s*(?:clause|section|article)\s+\d+/gim) ?? [])
    .length;
  const numbered = (content.match(/^\s*\d{1,2}[.)]\s+/gm) ?? []).length;
  const sectionCount =
    (content.match(/\b(?:clause|section|article)\s+\d+/gi) ?? []).length;
  return { clauseCount: Math.max(named, numbered), sectionCount };
}

const COMPANY_RE =
  /([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*)*?\s+(?:Sdn\.?\s*Bhd\.?|Pte\.?\s*Ltd\.?|Ltd\.?|LLC|LLP|Incorporated|Inc\.?))/g;

function extractParties(doc: DocumentRecord): string[] {
  const parts = new Set<string>();
  const p = doc.parties;
  if (p) {
    const roles: Array<[keyof NonNullable<typeof p>, string]> = [
      ["plaintiff", "Plaintiff"],
      ["defendant", "Defendant"],
      ["petitioner", "Petitioner"],
      ["respondent", "Respondent"],
      ["appellant", "Appellant"],
      ["appellee", "Appellee"],
    ];
    for (const [key, label] of roles) {
      const value = p[key];
      if (value && value.trim()) parts.add(`${value.trim()} (${label})`);
    }
  }
  // Fallback: company-style names mentioned in the body.
  if (parts.size === 0) {
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    COMPANY_RE.lastIndex = 0;
    while ((m = COMPANY_RE.exec(doc.content)) && seen.size < 6) {
      seen.add(m[0].trim());
    }
    for (const name of seen) parts.add(name);
  }
  return Array.from(parts).slice(0, 8);
}

// ─── Risk detectors ────────────────────────────────────────────────────────

interface Detector {
  id: string;
  kind: FindingKind;
  severity: Severity;
  title: string;
  detail: string;
  recommendation?: string;
  patterns: RegExp[];
}

const DETECTORS: Detector[] = [
  {
    id: "noncompete",
    kind: "termination",
    severity: "high",
    title: "Non-compete / restrictive covenant",
    detail:
      "A non-compete or similar restrictive covenant was detected. In Malaysia these are enforceable only where the scope (duration, geography, activity) is reasonable.",
    recommendation:
      "Review duration and geographical scope; consider capping at 12 months and limiting to the relevant market.",
    patterns: [
      /non[-\s]?compete/i,
      /shall not compete/i,
      /not to compete/i,
      /refrain from (?:carrying on|engaging in).*(?:business|trade)/i,
    ],
  },
  {
    id: "termination",
    kind: "termination",
    severity: "medium",
    title: "Termination provision",
    detail:
      "Termination language was detected. Confirm notice periods, grounds and any without-cause/at-will termination rights.",
    recommendation:
      "Verify notice periods satisfy the Employment Act 1955 and that termination-for-cause grounds are complete.",
    patterns: [
      /terminat(?:ion|e|ed)/i,
      /notice period/i,
      /without cause/i,
      /for convenience/i,
    ],
  },
  {
    id: "payment",
    kind: "payment",
    severity: "medium",
    title: "Payment / deduction terms",
    detail:
      "Payment or deduction terms were detected. Deductions from wages must satisfy Employment Act 1955 s.24.",
    recommendation:
      "Check that any deductions are by written authorisation and within s.24 limits.",
    patterns: [/deduct(?:ion)?/i, /wage/i, /salary/i, /shall be paid/i, /remunerat/i],
  },
  {
    id: "overtime",
    kind: "ambiguity",
    severity: "medium",
    title: "Overtime terms ambiguous",
    detail:
      "Overtime is referenced but the calculation basis (hourly vs. monthly) is not clearly stated.",
    recommendation: "State the overtime rate basis and multiplier explicitly.",
    patterns: [/overtime/i, /o-?time/i],
  },
  {
    id: "confidentiality",
    kind: "confidentiality",
    severity: "low",
    title: "Confidentiality / NDA",
    detail:
      "Confidentiality or non-disclosure terms were detected. Confirm survival period and scope of protected information.",
    patterns: [/confidential/i, /non[-\s]?disclosure/i, /\bNDA\b/i],
  },
  {
    id: "ip",
    kind: "right",
    severity: "medium",
    title: "Intellectual property assignment",
    detail:
      "IP ownership/assignment language was detected. Confirm the assignment covers all work product and future rights.",
    recommendation: "Ensure a present-tense present + future assignment of IP.",
    patterns: [
      /intellectual property/i,
      /assign all (?:rights|IP)/i,
      /work product/i,
      /all rights in/i,
    ],
  },
  {
    id: "indemnity",
    kind: "obligation",
    severity: "high",
    title: "Indemnification obligation",
    detail:
      "An indemnity/indemnification obligation was detected. These can expose significant liability — confirm scope and caps.",
    recommendation: "Negotiate a cap and carve-outs for willful misconduct/gross negligence.",
    patterns: [/indemnif/i],
  },
  {
    id: "liability",
    kind: "restriction",
    severity: "medium",
    title: "Liability limitation / disclaimer",
    detail:
      "A limitation of liability, disclaimer or 'as-is' clause was detected. Confirm it is not over-broad or unenforceable.",
    recommendation: "Check the cap amount and that it does not exclude personal injury/fraud.",
    patterns: [
      /limitation of liability/i,
      /in no event (?:shall|will|be liable)/i,
      /as[-\s]?is/i,
      /disclaims? (?:all|any) (?:warrant|guarant)/i,
    ],
  },
  {
    id: "penalty",
    kind: "penalty",
    severity: "high",
    title: "Penalty / liquidated damages",
    detail:
      "A penalty or liquidated-damages clause was detected. Genuine pre-estimate of loss is required to be enforceable.",
    recommendation: "Ensure the figure is a genuine pre-estimate of loss, not a penalty.",
    patterns: [/penalt/i, /liquidated damages/i, /forfeit/i, /liquidated/i],
  },
  {
    id: "auto-renew",
    kind: "payment",
    severity: "low",
    title: "Automatic renewal",
    detail:
      "An automatic renewal / evergreen clause was detected. Confirm notice-to-terminate windows.",
    patterns: [
      /auto[-\s]?renew/i,
      /automatic renewal/i,
      /shall renew/i,
      /evergreen/i,
    ],
  },
  {
    id: "dispute",
    kind: "obligation",
    severity: "info",
    title: "Dispute resolution",
    detail:
      "Dispute resolution / arbitration / jurisdiction terms were detected. Confirm the forum and governing law are workable.",
    patterns: [
      /arbitration/i,
      /dispute resolution/i,
      /exclusive (?:jurisdiction|venue)/i,
      /governing law/i,
    ],
  },
];

// ─── Analysis builder ──────────────────────────────────────────────────────

const MIN_CONTENT_LEN = 40;

export function analyzeDocument(doc: DocumentRecord): AnalyzedDocument {
  const content = (doc.content ?? "").trim();
  const insufficient = content.length < MIN_CONTENT_LEN;
  const { clauseCount, sectionCount } = countClauses(content);
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

  const findings: Finding[] = [];
  const seen = new Set<string>();

  if (!insufficient) {
    for (const d of DETECTORS) {
      let excerpt: string | undefined;
      for (const pattern of d.patterns) {
        excerpt = firstExcerpt(content, pattern);
        if (excerpt) break;
      }
      if (!excerpt || seen.has(d.id)) continue;
      seen.add(d.id);
      findings.push({
        id: `f-${d.id}`,
        kind: d.kind,
        title: d.title,
        detail: d.detail,
        excerpt,
        severity: d.severity,
        recommendation: d.recommendation,
      });
    }

    // Conditional: garden-leave gap when termination is present but no garden leave.
    const hasTermination = /terminat/i.test(content);
    const hasGardenLeave = /garden[-\s]?leave/i.test(content);
    if (hasTermination && !hasGardenLeave) {
      findings.push({
        id: "f-garden-leave",
        kind: "missing_clause",
        title: "Missing express garden-leave language",
        detail:
          "The document references termination but contains no express garden-leave provision.",
        excerpt: firstExcerpt(content, /terminat/i),
        severity: "medium",
        recommendation: "Add an express garden-leave clause with full pay.",
      });
    }
  }

  const highCount = findings.filter((f) => f.severity === "high").length;
  const riskScore = Math.min(
    100,
    findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0)
  );
  const qualityScore = Math.max(
    0,
    100 -
      findings.reduce(
        (sum, f) =>
          sum +
          (f.severity === "high" ? 15 : f.severity === "medium" ? 6 : 2),
        0
      )
  );

  const kindsPresent = Array.from(new Set(findings.map((f) => f.kind)));
  const topKinds = kindsPresent.slice(0, 3).join(", ");

  const summary = insufficient
    ? "The document has too little text to analyse reliably. Upload a fuller version to obtain findings."
    : `${humaniseDocType(doc.docType)} with ${clauseCount} structured clause(s). ${findings.length} risk area(s) identified${topKinds ? ` — focusing on ${topKinds}` : ""}. Rule-based extraction; each finding quotes its source.`;

  const confidence = insufficient
    ? 0
    : Math.min(0.9, 0.5 + findings.length * 0.04 + (sectionCount > 0 ? 0.05 : 0));

  return {
    id: `analysis-${doc.id}`,
    documentId: doc.id,
    status: insufficient ? "complete" : "complete",
    summary,
    findings,
    parties: extractParties(doc),
    dates: collectDates(content),
    generatedAt: new Date().toISOString(),
    provenance: {
      source: doc.title,
      sourceType: humaniseDocType(doc.docType),
      method: "deterministic-clause-extractor (rule-based, no LLM)",
      dataClass: "confidential",
      hitlLevel: 1,
      hitlLabel: "Recommend",
      confidence,
      verified: false,
      note: "Findings are pattern-based and quote their source. A lawyer must review before relying on them.",
    },
    stats: {
      wordCount,
      charCount: content.length,
      clauseCount,
      sectionCount,
      estimatedPages: Math.max(1, Math.round(wordCount / 420)),
    },
    riskScore,
    qualityScore,
    insufficient,
  };
}

function humaniseDocType(docType?: string | null): string {
  if (!docType) return "Document";
  const known: Record<string, string> = {
    CONTRACT: "Contract",
    AGREEMENT: "Agreement",
    BRIEF: "Brief",
    MOTION: "Motion",
    MEMORANDUM: "Memorandum",
    PLEADING: "Pleading",
    LETTER: "Letter",
    OTHER: "Document",
  };
  return known[docType] ?? docType.toLowerCase().replace(/_/g, " ");
}
