export interface EvalRun<I = unknown, O = unknown> {
  caseId: string; input: I; actual?: O; expected?: O;
  score: number; passed: boolean; error?: string; durationMs: number;
}
export interface EvalReport<I = unknown, O = unknown> {
  suiteId: string; total: number; passed: number; failed: number;
  averageScore: number; runs: EvalRun<I, O>[];
  startedAt: string; completedAt: string;
}
