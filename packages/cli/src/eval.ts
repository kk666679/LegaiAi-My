/**
 * @lawmate/cli — eval subcommand.
 */
import { runEval } from '@lawmate/eval';

export function evalInfo(): void {
  void runEval;
  process.stdout.write('LAWMATE Evaluation\n');
  process.stdout.write('=================\n\n');
  process.stdout.write('Metrics: Accuracy, Precision, Recall, F1, Retrieval relevance, Groundedness, Citation correctness, Safety violations, Latency, Cost, Reliability.\n');
}