/**
 * @lawmate/cli — kdream subcommand.
 */
export function kdreamInfo(): void {
  process.stdout.write('LAWMATE KDREAM\n');
  process.stdout.write('=============\n\n');
  process.stdout.write('Knowledge/reasoning representation layer.\n');
  process.stdout.write('Sections: context, entities, concepts, observations, hypotheses, goals, plans, decisions, evidence, provenance, confidence\n');
}