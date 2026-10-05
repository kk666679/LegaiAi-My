#!/usr/bin/env node
'use strict';

/**
 * dream — memory consolidation cycle (alias for `bin/kdream.js`).
 *
 * Kept as its own entrypoint because `npm run dream` predates the module. The
 * renderer lives in `kdream/`; this file only supplies the stable facts the
 * substrate has asserted since the first cycle.
 *
 *   node bin/dream.js              # light cycle
 *   node bin/dream.js deep         # + pattern detection
 *   node bin/dream.js full --dry-run
 */

const { createDreamer, MODES } = require('../kdream');

const STABLE_FACTS = [
  'KG store lives in `kg/kg.db`; edges decay at 0.95 per dream cycle.',
  'Durable run records belong in `spine/spine.db`, never in flat files.'
];

(async () => {
  const argv = process.argv.slice(2);
  const mode = argv.find(a => MODES.includes(a)) || 'light';
  const dryRun = argv.includes('--dry-run') || argv.includes('-n');

  const dreamer = createDreamer({ stableFacts: STABLE_FACTS, policy: { dryRun } });
  const report = await dreamer.runCycle({ mode, reason: 'dream' });

  const promoted = report.phases.find(p => p.name === 'promote');
  console.log(
    `dream -> MEMORY.md ${dryRun ? 'not written (dry-run)' : 'rewritten'} ` +
    `(${promoted ? promoted.promoted : 0} promoted / ${promoted ? promoted.files.length : 0} insights, ${report.mode})`
  );
  if (!report.ok) process.exit(1);
})().catch(e => { console.error('dream error:', e.message); process.exit(1); });