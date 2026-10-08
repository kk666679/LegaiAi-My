/**
 * @lawmate/cli — learning subcommand.
 */
import { LearningPipeline } from '@lawmate/learning';

export function learningInfo(): void {
  const pipeline = new LearningPipeline();
  void pipeline;
  process.stdout.write('LAWMATE Learning\n');
  process.stdout.write('===============\n\n');
  process.stdout.write('Controlled loop: Execution → Outcome → Feedback → Dataset → Evaluation → Proposal → Safety → Approval → Artifact → Canary → Evaluation → Production\n');
}