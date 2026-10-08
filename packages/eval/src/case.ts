export interface EvalCase<I = unknown, O = unknown> {
  id: string; input: I; expected?: O;
  scorer?: (actual: unknown, expected: O | undefined) => number;
}
