#!/usr/bin/env node
import { createDreamer, MODES } from '../kdream/index.js';

'use strict';

/**
 * kdream — run a memory consolidation cycle.
 *
 *   node bin/kdream.js light
 *   node bin/kdream.js deep --dry-run
 *   node bin/kdream.js full --json --reason=nightly
 *
 * `bin/dream.js` is the alias for the default light cycle.
 */

function parseArgs(argv) {
  const args = { mode: 'light', dryRun: false, json: false, reason: 'cli' };
  for (const a of argv.slice(2)) {
    if (a === '--dry-run' || a === '-n') args.dryRun = true;
    else if (a === '--json') args.json = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a.startsWith('--reason=')) args.reason = a.slice(9);
    else if (a.startsWith('-')) throw new Error(`unknown flag: ${a}`);
    else args.mode = a;
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log([
      'kdream — memory consolidation cycle',
      '',
      'Usage:',
      `  node bin/kdream.js <${MODES.join('|')}> [--dry-run] [--json] [--reason=<text>]`,
      '',
      'Phases:',
      '  light  load → promote → reflect',
      '  deep   light + patterns',
      '  full   deep + archive'
    ].join('\n'));
    return;
  }

  const dreamer = createDreamer({ policy: { dryRun: args.dryRun } });
  const report = await dreamer.runCycle({ mode: args.mode, reason: args.reason });

  if (args.json) { console.log(JSON.stringify(report, null, 2)); return; }

  console.log(`kdream ${report.mode}${report.dryRun ? ' (dry-run)' : ''} → ${report.ok ? 'ok' : 'FAILED'}`);
  for (const p of report.phases) {
    const extra = [];
    for (const k of ['count', 'promoted', 'archived', 'kept', 'rendered', 'bytes']) {
      if (p[k] != null) extra.push(`${k}=${p[k]}`);
    }
    if (p.written != null) extra.push(`written=${p.written}`);
    if (p.error) extra.push(`error=${p.error}`);
    console.log(`  ${p.name.padEnd(9)} ok=${String(p.ok).padEnd(5)} ${String(p.ms).padStart(4)}ms  ${extra.join('  ')}`);
  }
  console.log(`  ${'total'.padEnd(9)}      ${String(report.ms).padStart(4)}ms`);
  if (!report.ok) process.exit(1);
})().catch(e => { console.error('kdream error:', e.message); process.exit(1); });
