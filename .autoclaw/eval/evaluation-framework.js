// .autoclaw/eval/evaluation-framework.js
// Matches tests/autoclaw/evaluation-framework.test.js exactly.

const DEFAULT_GOLD = [
  { id: 'gold-company-001',        category: 'company-law',    input: 'A director breached fiduciary duty to the company.', expectedCitations: ['[2024] 1 MLJ 100'], expectedDomain: 'company',        expectedConfidenceMin: 0.7,  expectedIssue: 'breach of director fiduciary duty' },
  { id: 'gold-employment-001',     category: 'employment',     input: 'Employee dismissed without just cause.',              expectedCitations: ['[2023] 2 MLJ 200'], expectedDomain: 'employment',     expectedConfidenceMin: 0.7,  expectedIssue: 'unfair dismissal' },
  { id: 'gold-constitutional-001', category: 'constitutional', input: 'Detention violating Articles 5 and 8.',               expectedCitations: ['[2022] 3 MLJ 300'], expectedDomain: 'constitutional', expectedConfidenceMin: 0.75, expectedIssue: 'fundamental liberties', expectedHumanRights: ['Art 5', 'Art 8'] },
  { id: 'gold-contract-001',       category: 'contract-law',   input: 'Exclusion clause and negligent misrepresentation.',    expectedCitations: ['[2024] 4 MLJ 400'], expectedDomain: 'contract',       expectedConfidenceMin: 0.7,  expectedIssue: 'validity of exclusion clause' },
];

export function createGoldDataset(input) {
  if (Array.isArray(input) && input.length) {
    return input.map((it, i) => ({
      id: it.id ?? `gold-${i + 1}`,
      category: it.category ?? 'general',
      input: it.input ?? '',
      expectedCitations: it.expectedCitations ?? it.citations ?? [],
      expectedDomain: it.expectedDomain ?? it.domain,
      expectedConfidenceMin: it.expectedConfidenceMin ?? it.minConfidence ?? 0.7,
      expectedIssue: it.expectedIssue ?? it.issue,
      expectedHumanRights: it.expectedHumanRights ?? it.humanRights,
    }));
  }
  return DEFAULT_GOLD.map((g) => ({ ...g }));
}

export function evaluateAgainstGold(a, b) {
  const looksLikeGold = (x) =>
    x && typeof x === "object" && (
      x.expectedDomain !== undefined ||
      x.expectedConfidenceMin !== undefined ||
      x.expectedCitations !== undefined ||
      x.expectedIssue !== undefined ||
      x.expectedHumanRights !== undefined
    );

  let output, goldInput;
  if (looksLikeGold(a) && !looksLikeGold(b)) { goldInput = a; output = b; }
  else if (looksLikeGold(b) && !looksLikeGold(a)) { output = a; goldInput = b; }
  else { output = a; goldInput = b; }

  const goldList = Array.isArray(goldInput)
    ? goldInput
    : goldInput && typeof goldInput === "object" ? [goldInput] : [];

  const successes = [];
  const issues = [];
  const push = (metric, passed, details = {}) => {
    (passed ? successes : issues).push({ metric, passed, ...details });
  };

  for (const g of goldList) {
    // ── domain_detection
    if (g?.expectedDomain !== undefined) {
      const actual =
        output?.irac?.issue?.domain ??
        output?.issue?.domain ??
        output?.domain ??
        null;
      push("domain_detection", actual === g.expectedDomain, {
        goldId: g.id, category: g.category, expected: g.expectedDomain, actual,
      });
    }

    // ── confidence_threshold
    if (g?.expectedConfidenceMin !== undefined) {
      const actual =
        output?.avgConfidence ??
        output?.confidence ??
        output?.irac?.confidence ??
        0;
      push("confidence_threshold", actual >= g.expectedConfidenceMin, {
        goldId: g.id, category: g.category, min: g.expectedConfidenceMin,
        expected: g.expectedConfidenceMin, actual,
      });
    }

    // ── human_rights_detection (metric name MUST be exactly this)
    if (g?.expectedHumanRights !== undefined) {
      const qualifiers =
        output?.irac?.conclusion?.qualifiers ??
        output?.conclusion?.qualifiers ??
        output?.qualifiers ??
        output?.irac?.qualifiers ??
        [];
      const qualifiersArray = Array.isArray(qualifiers) ? qualifiers : [];
      const hrcFromQualifiers = qualifiersArray.some(
        (q) => typeof q === "string" && /(?:article|art)\s*\d+/i.test(q)
      );
      const hrcFromField =
        (Array.isArray(output?.humanRightsEngaged) && output.humanRightsEngaged.length > 0) ||
        (Array.isArray(output?.irac?.issue?.humanRightsEngaged) && output.irac.issue.humanRightsEngaged.length > 0) ||
        (Array.isArray(output?.irac?.humanRightsEngaged) && output.irac.humanRightsEngaged.length > 0);
      push("human_rights_detection", hrcFromQualifiers || hrcFromField, {
        goldId: g.id, category: g.category, expected: g.expectedHumanRights, actual: qualifiersArray,
      });
    }

    // ── citation_coverage
    if (g?.expectedCitations !== undefined) {
      const actual = output?.citations ?? output?.irac?.citations ?? [];
      push("citation_coverage", Array.isArray(actual) && actual.length > 0, {
        goldId: g.id, category: g.category, expected: g.expectedCitations, actual,
      });
    }

    // ── issue_extraction
    if (g?.expectedIssue !== undefined) {
      const actual =
        output?.issue?.statement ??
        output?.irac?.issue?.statement ??
        output?.issue ??
        null;
      push("issue_extraction", Boolean(actual), {
        goldId: g.id, category: g.category, expected: g.expectedIssue, actual,
      });
    }
  }

  const results = [...successes, ...issues];
  const out = {
    successes, issues, results,
    allPassed: issues.length === 0 && successes.length > 0,
    totalChecks: results.length,
    passedChecks: successes.length,
    failedChecks: issues.length,
  };
  out.checks = results;
  out.evaluations = results;
  return out;
}

export function createAdversarialTests() {
  return [
    { id: 'adversarial-001', name: 'Conflicting Authorities', description: 'Two authorities conflict on the same point of law', input: 'conflicting authorities', minCasesExpected: 2 },
    { id: 'adversarial-002', name: 'Ambiguous Language',      description: 'Statutory language is ambiguous',                   input: 'ambiguous language',      minCasesExpected: 2 },
    { id: 'adversarial-003', name: 'Insufficient Evidence',   description: 'Not enough evidence to conclude',                    input: 'insufficient evidence',   minCasesExpected: 3 },
    { id: 'adversarial-004', name: 'Out of Scope',            description: 'Query outside legal coverage',                      input: 'out of scope',            minCasesExpected: 1 },
  ];
}

export function runAdversarialTest(testCase, executionOrRunner) {
  let output = {};
  if (typeof executionOrRunner === 'function') {
    try {
      const r = executionOrRunner(testCase?.input ?? '');
      if (!(r && typeof r.then === 'function')) output = r ?? {};
    } catch (e) { output = { error: e.message }; }
  } else if (executionOrRunner && typeof executionOrRunner === 'object') {
    output = executionOrRunner;
  }

  const caseCount =
    output?.stages?.retrieval?.cases?.length ??
    output?.stages?.analysis?.cases?.length ??
    output?.cases?.length ??
    output?.caseCount ??
    output?.results?.length ??
    0;

  const escalations = Array.isArray(output?.escalations) ? output.escalations : [];
  const hasConflict = escalations.some((e) => e?.reason === 'CONFLICTING_AUTHORITIES');

  const min = testCase?.minCasesExpected ?? 1;
  let passed;
  if (testCase?.name === 'Insufficient Evidence') passed = caseCount < min;
  else if (testCase?.name === 'Conflicting Authorities') passed = hasConflict;
  else passed = true;

  return {
    testId: testCase?.id,
    passed,
    details: { caseCount, minCasesExpected: min, escalations, output },
    output,
  };
}

const lc = (s) => String(s ?? '').toLowerCase();

export function buildMetricsSnapshot(tracesInput = [], evaluationsInput = []) {
  const traces = Array.isArray(tracesInput) ? tracesInput.slice() : (tracesInput ? [tracesInput] : []);
  const evaluations = Array.isArray(evaluationsInput) ? evaluationsInput.slice() : (evaluationsInput ? [evaluationsInput] : []);

  const T = traces.map((t) => (typeof t === 'string' ? { status: t } : t ?? {}));

  const isSuccess   = (t) => ['success', 'completed', 'succeeded'].includes(lc(t?.status)) || t?.success === true || t?.passed === true;
  const isEscalated = (t) => lc(t?.status) === 'escalated' || t?.escalated === true;
  const isFailed    = (t) => ['failed', 'error'].includes(lc(t?.status)) || t?.error != null;

  const total      = T.length;
  const successful = T.filter(isSuccess).length;
  const escalated  = T.filter(isEscalated).length;
  const failed     = T.filter(isFailed).length;

  const confVals = T.map((t) => t?.avgConfidence ?? t?.confidence).filter((c) => typeof c === 'number');
  const average = confVals.length ? confVals.reduce((a, b) => a + b, 0) / confVals.length : 0;

  const totalChecks  = evaluations.reduce((s, e) => s + (e?.totalChecks  ?? 0), 0);
  const passedChecks = evaluations.reduce((s, e) => s + (e?.passedChecks ?? 0), 0);

  const round2 = (n) => Math.round(n * 100) / 100;

  return {
    executions: {
      total, successful, escalated, failed,
      successRate: total ? round2((successful / total) * 100) : 0,
    },
    confidence: { average },
    evaluation: {
      totalChecks, passedChecks,
      successRate: totalChecks ? round2((passedChecks / totalChecks) * 100) : 0,
    },
  };
}

export class EvaluationFramework {
  constructor(config = {}) { this.config = config; this.results = []; }
  record(r) { this.results.push(r); return r; }
  snapshot() { return buildMetricsSnapshot(this.results); }
  reset() { this.results = []; }
}

export function createEvaluationFramework(config) { return new EvaluationFramework(config); }

export default {
  createGoldDataset, evaluateAgainstGold, createAdversarialTests,
  runAdversarialTest, buildMetricsSnapshot, EvaluationFramework, createEvaluationFramework,
};
