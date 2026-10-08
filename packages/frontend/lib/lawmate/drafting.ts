/**
 * Client-side drafting helpers for the Drafting Studio.
 *
 * These are the same transparent heuristics the `drafting` tRPC router runs
 * server-side (see backend/src/trpc/routers/drafting.ts). They exist so the
 * Quality and Citations tabs stay useful while a draft is still an unsaved
 * local session — once the draft is persisted the server result wins.
 *
 * Nothing here invents an authority: citations are only recognised when the
 * draft already contains a real Act number or Malaysian reporter reference.
 */

const REPORTER_RE = /\[\d{4}\]\s+\d+\s+(?:MLJ|AM|AMCR)\s+\d+/g;
const ACT_RE = /\bAct\s+(?:[Aa]\d+|\d+)/g;
const SECTION_RE = /\bs\.\s*\d+[A-Za-z]*(?:\(\d+\))?/g;

/** Legal-sounding claims that need an authority attached. */
const ASSERTION_RE =
  /\b(must|shall|is required|is liable|is entitled|has the right|is unlawful|amounts to|constitutes|breach(?:es)?)\b/i;
const HAS_AUTHORITY_RE =
  /(?:\bAct\s|\bs\.\s|\[\d{4}\]|MLJ\b|AMCR\b|Article\s|Art\.)/i;

export interface DetectedCitation {
  type: "reporter" | "act" | "section";
  raw: string;
}

export interface UnsupportedAssertion {
  sentence: string;
  rationale: string;
}

export interface DraftAnalysis {
  citations: DetectedCitation[];
  unsupported: UnsupportedAssertion[];
  coverage: number;
  words: number;
  characters: number;
  paragraphs: number;
  /** 0–100. Same weighting as the server score, minus an unsupported penalty. */
  score: number;
}

function matchAll(re: RegExp, text: string): string[] {
  re.lastIndex = 0;
  return text.match(re) ?? [];
}

export function detectCitations(text: string): DetectedCitation[] {
  const out: DetectedCitation[] = [];
  for (const raw of matchAll(REPORTER_RE, text))
    out.push({ type: "reporter", raw });
  for (const raw of matchAll(ACT_RE, text)) out.push({ type: "act", raw });
  for (const raw of matchAll(SECTION_RE, text)) out.push({ type: "section", raw });
  return out;
}

export function detectUnsupported(text: string): UnsupportedAssertion[] {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const out: UnsupportedAssertion[] = [];
  sentences.forEach((sentence) => {
    if (ASSERTION_RE.test(sentence) && !HAS_AUTHORITY_RE.test(sentence)) {
      out.push({
        sentence,
        rationale: "Legal-sounding assertion without an attached authority.",
      });
    }
  });
  return out;
}

export function analyzeDraft(text: string): DraftAnalysis {
  const citations = detectCitations(text);
  const unsupported = detectUnsupported(text);
  const denom = citations.length + unsupported.length || 1;
  const citationScore = citations.length === 0 ? 55 : Math.min(100, 60 + citations.length * 12);
  const penalty = Math.min(30, unsupported.length * 8);
  const grounded = citations.length > 0 ? 90 : 40;

  return {
    citations,
    unsupported,
    coverage: citations.length / denom,
    words: text.split(/\s+/).filter(Boolean).length,
    characters: text.length,
    paragraphs: text.split(/\n{2,}/).filter((p) => p.trim()).length,
    score: Math.max(0, Math.round(citationScore * 0.5 + grounded * 0.5 - penalty)),
  };
}

/* ---------------------------------------------------------------------- */
/* Template seeds — illustrative starting points, not legal advice.       */
/* Deliberately free of statute citations so nothing is asserted that the  */
/* workspace has not verified.                                             */
/* ---------------------------------------------------------------------- */

export const DEFAULT_TEMPLATE_ID = "warning_letter";

export function templateSeed(templateId: string): string {
  const seeds: Record<string, string> = {
    warning_letter: `Date: [DD Month YYYY]

Dear [Name],

We refer to the incident on [date] and to our conversations on [date].

This letter is a formal written warning. It records the standard we expect, the improvement we require, and the consequences should the conduct recur.

You are required to respond in writing within seven (7) working days. Your response will be considered before any further step is taken.

Yours faithfully,

[Name]
[Title]
[Company]`,
    show_cause_letter: `Date: [DD Month YYYY]

Dear [Name],

We are writing to require a written explanation of the circumstances surrounding [describe the matter].

Please provide your explanation within seven (7) working days, together with any documents you rely on.

No disciplinary decision has been made. You will be given an opportunity to respond before any decision is communicated to you.

Yours faithfully,

[Name]
[Title]
[Company]`,
    legal_letter: `Date: [DD Month YYYY]

WITHOUT PREJUDICE

Dear Sirs,

We act for [Client]. Our instructions are to require [the sum of RM____] within fourteen (14) days of this letter.

If the sum is not paid, our client is prepared to commence proceedings without further notice, together with interest and costs.

All correspondence should be directed to the undersigned.

Yours faithfully,

[Name]
[Advocate & Solicitor]`,
    employment_agreement: `EMPLOYMENT AGREEMENT

Date: [DD Month YYYY]

BETWEEN

[Company] (the "Company") AND [Employee] (the "Employee").

1. APPOINTMENT
The Company appoints the Employee and the Employee accepts the appointment on the terms set out below.

2. DUTIES
The Employee shall perform the duties assigned by the Company and shall comply with the Company's policies and procedures.

3. PLACE OF WORK
The Employee shall be based at [location], subject to reassignment as the business requires.

4. REMUNERATION
The Employee shall be paid a monthly salary of RM____, subject to deduction as permitted by law.

5. CONFIDENTIALITY
The Employee shall not disclose Confidential Information during or after employment.

6. TERMINATION
Either party may terminate the employment by giving the notice stated in the schedule below, subject to the applicable statutory requirements.

AGREED AND SIGNED by the parties on [DD Month YYYY].`,
    company_policy: `[COMPANY] POLICY

Effective date: [DD Month YYYY]

1. PURPOSE
This policy sets out the Company's position on [subject].

2. SCOPE
This policy applies to all employees, contractors and visitors.

3. RESPONSIBILITIES
Managers are responsible for communicating this policy. Employees are responsible for reading and complying with it.

4. REVIEW
This policy is reviewed annually by [owner].`,
    hostel_rules: `RULES AND REGULATIONS

These rules apply to all residents of [Hostel name].

1. QUIET HOURS
Quiet hours are observed from 11:00 p.m. to 7:00 a.m. daily.

2. VISITORS
Visitors must be registered at the front desk and are not permitted in resident rooms after 9:00 p.m.

3. CARE OF PREMISES
Residents must keep their rooms and shared areas clean and in good condition.

4. PROHIBITED ITEMS
Smoking, vaping and flammable materials are prohibited in all areas of the premises.

5. BREACH
Any breach of these rules may result in a warning, and repeated breaches may result in termination of the agreement to reside.`,
    property_acknowledgement: `ACKNOWLEDGEMENT OF RECEIPT

Date: [DD Month YYYY]

I, [Name] (NRIC/Passport No.: [____]), acknowledge receipt of the following items from [Company]:

1. [Item 1] — [serial / description]
2. [Item 2] — [serial / description]

I confirm that the items listed above were received in good condition. I agree to return them in the same condition, fair wear and tear excepted, on or before [DD Month YYYY].

Signature: _______________
Name: [Name]
Date: [DD Month YYYY]`,
    hr_notice: `NOTICE TO ALL EMPLOYEES

Date: [DD Month YYYY]

This notice is issued to all employees of [Company].

[Describe the change, the reason and the effective date.]

Employees with questions should contact [name] at [contact].

[Name]
[Title]
[Company]`,
    contract_clause: `[CLAUSE TITLE]

[Number].1  [Sub-clause heading]

[Number].1.1  [Operative wording.]

[Number].1.2  [Operative wording.]

[Number].2  [Further sub-clause.]

[Number].3  This clause is governed by the laws of Malaysia and the parties submit to the jurisdiction of the courts of Malaysia.`,
    internal_memo: `MEMORANDUM

TO: [Recipient]
FROM: [Author]
DATE: [DD Month YYYY]
RE: [Subject]

1. PURPOSE
This memorandum sets out [purpose].

2. BACKGROUND
[Background facts.]

3. ANALYSIS
[Analysis of the position, including any risk and the authority relied upon.]

4. RECOMMENDATION
[Recommended course of action.]

5. NEXT STEPS
[Owner and timeline.]`,
    custom: `[TITLE]

[DD Month YYYY]

[Start drafting here. Use the AI actions to refine wording, check consistency or identify risk — every citation you insert is validated against the LOM catalogue.]`,
  };

  return seeds[templateId] ?? seeds[DEFAULT_TEMPLATE_ID] ?? "";
}

export const DOC_TYPES: { value: string; label: string }[] = [
  { value: "LETTER_OF_DEMAND", label: "Letter of demand" },
  { value: "MEMORANDUM", label: "Memorandum" },
  { value: "LEGAL_OPINION", label: "Legal opinion" },
  { value: "RESEARCH_MEMORANDUM", label: "Research memorandum" },
  { value: "AFFIDAVIT", label: "Affidavit" },
  { value: "WRIT", label: "Writ" },
  { value: "STATEMENT_OF_CLAIM", label: "Statement of claim" },
  { value: "DEFENCE", label: "Defence" },
  { value: "SUBMISSION", label: "Submission" },
  { value: "CONTRACT_AGREEMENT", label: "Contract agreement" },
  { value: "CUSTOM", label: "Custom" },
];

/** Maps a Drafting Studio template id onto the `docType` enum the API accepts. */
export function docTypeForTemplate(templateId: string): string {
  switch (templateId) {
    case "warning_letter":
    case "show_cause_letter":
    case "legal_letter":
    case "hr_notice":
      return "LETTER_OF_DEMAND";
    case "internal_memo":
      return "MEMORANDUM";
    case "affidavit":
      return "AFFIDAVIT";
    default:
      return "CUSTOM";
  }
}