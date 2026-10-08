import type { EvalCase } from './case.js';
import type { EvalRun, EvalReport } from './report.js';
export async function runEval<I, O>(
  suiteId: string,
  cases: EvalCase<I, O>[],
  target: (input: I) => Promise<O>,
  threshold = 0.5
): Promise<EvalReport<I, O>> {
  const startedAt = new Date().toISOString();
  const runs: EvalRun<I, O>[] = [];
  for (const c of cases) {
    const start = Date.now();
    const run: EvalRun<I, O> = { caseId: c.id, input: c.input, expected: c.expected, score: 0, passed: false, durationMs: 0 };
    try {
      run.actual = await target(c.input);
      run.score = c.scorer ? c.scorer(run.actual, c.expected) : run.actual === c.expected ? 1 : 0;
      run.passed = run.score >= threshold;
    } catch (e) { run.error = (e as Error).message; }
    run.durationMs = Date.now() - start;
    runs.push(run);
  }
  const passed = runs.filter((r) => r.passed).length;
  const averageScore = runs.length ? runs.reduce((s, r) => s + r.score, 0) / runs.length : 0;
  return { suiteId, total: runs.length, passed, failed: runs.length - passed, averageScore, runs, startedAt, completedAt: new Date().toISOString() };
}
