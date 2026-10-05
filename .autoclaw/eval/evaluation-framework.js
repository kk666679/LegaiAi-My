// .autoclaw/eval/evaluation-framework.js

/** Build a gold dataset from labelled examples. */
export function createGoldDataset(items = []) {
  const cases = items.map((it, i) => ({
    id: it.id ?? `gold-${i + 1}`,
    input: it.input ?? it.question ?? it.prompt ?? "",
    expected: it.expected ?? it.answer ?? null,
    tags: it.tags ?? [],
    weight: it.weight ?? 1,
  }));
  return {
    size: cases.length,
    cases,
    get(id) { return cases.find((c) => c.id === id); },
    filter(fn) { return cases.filter(fn); },
  };
}

/** Evaluate a runner against a gold dataset. */
export async function evaluateAgainstGold(dataset, runner) {
  const cases = Array.isArray(dataset) ? dataset : dataset?.cases ?? [];
  const results = [];
  for (const c of cases) {
    let actual;
    let error;
    try {
      actual = await runner(c.input);
    } catch (e) {
      error = e.message;
    }
    const passed = !error && isEqual(actual, c.expected);
    results.push({ id: c.id, input: c.input, expected: c.expected, actual, passed, error, score: passed ? 1 : 0 });
  }
  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length ? passed / results.length : 0,
  };
}

/** Create adversarial tests — perturbed variants of an input set. */
export function createAdversarialTests(items = [], opts = {}) {
  const strategies = opts.strategies ?? ["typo", "case", "whitespace", "synonym"];
  const tests = [];
  for (const it of items) {
    const text = String(it.input ?? it.prompt ?? "");
    for (const s of strategies) {
      tests.push({ id: `${it.id ?? "x"}-adv-${s}`, strategy: s, input: perturb(text, s), expected: it.expected ?? null });
    }
  }
  return { size: tests.length, tests };
}

function perturb(text, strategy) {
  switch (strategy) {
    case "typo": return text.replace(/([aeiou])/i, "$1$1");
    case "case": return text.toUpperCase();
    case "whitespace": return text.replace(/\s+/g, "  ");
    case "synonym": return text.replace(/\bact\b/gi, "statute").replace(/\bcase\b/gi, "decision");
    default: return text;
  }
}

/** Run a single adversarial test against a runner. */
export async function runAdversarialTest(test, runner) {
  let actual; let error;
  try { actual = await runner(test.input); } catch (e) { error = e.message; }
  const passed = !error && isEqual(actual, test.expected);
  return { id: test.id, strategy: test.strategy, passed, actual, expected: test.expected, error };
}

function isEqual(a, b) {
  if (a === b) return true;
  if (typeof a === "string" && typeof b === "string") return a.trim() === b.trim();
  return JSON.stringify(a) === JSON.stringify(b);
}

export function buildMetricsSnapshot(results = []) {
  const total = results.length;
  const passed = results.filter((r) => r && r.passed).length;
  return {
    total, passed, failed: total - passed,
    passRate: total ? passed / total : 0,
    avgScore: total ? results.reduce((s, r) => s + (r?.score ?? 0), 0) / total : 0,
    generatedAt: new Date().toISOString(),
  };
}

export class EvaluationFramework {
  constructor(config = {}) { this.config = config; this.results = []; }
  record(r) { this.results.push(r); return r; }
  snapshot() { return buildMetricsSnapshot(this.results); }
  reset() { this.results = []; }
}

export function createEvaluationFramework(c) { return new EvaluationFramework(c); }

export default {
  createGoldDataset, evaluateAgainstGold, createAdversarialTests, runAdversarialTest,
  buildMetricsSnapshot, EvaluationFramework, createEvaluationFramework,
};
