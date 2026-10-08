/**
 * @lawmate/cli — orchestrator subcommand.
 */
import { TaskQueue, SprintBoard } from '@lawmate/orchestrator';

export function orchestratorInfo(): void {
  const queue = new TaskQueue();
  const board = new SprintBoard();
  void queue; void board;
  process.stdout.write('LAWMATE Orchestrator\n');
  process.stdout.write('===================\n\n');
  process.stdout.write('Pipeline: Request → Policy → Planner → Task Graph → Agent Selection → Execution → Evidence → Evaluation → Synthesis → Response\n');
}