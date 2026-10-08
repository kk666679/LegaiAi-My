#!/usr/bin/env node
import * as skills from '../skills/index.js';
import { ROOT } from './_util.js';

import { runGolden } from '../skills/runner.js';

'use strict';

/**
 * skills — inspect and validate the skill envelopes.
 *
 * `eval` runs the golden suite. No skill implementations are wired yet, so
 * every case reports `skipped`; pass an impl through the runner API when one
 * exists (see README.md).
 */

const [, , cmd, ...rest] = process.argv;

function pad(s, n) { return String(s).padEnd(n, ' '); }

function usage() {
  console.log([
    'skills — inspect and validate skill envelopes',
    '',
    'Usage:',
    '  node bin/skills.js list',
    '  node bin/skills.js validate',
    '  node bin/skills.js show <name>',
    '  node bin/skills.js golden <name>',
    '  node bin/skills.js eval <name>',
    '',
    `Envelope root: ${ROOT}/skills`
  ].join('\n'));
}

function need(arg) {
  if (!arg) { console.error(`skills: "${cmd}" needs an argument`); process.exit(1); }
  return arg;
}

async function main() {
  switch (cmd) {
    case 'list': {
      const counts = skills.counts();
      const rows = Object.entries(counts);
      const w = Math.max(4, ...rows.map(([k]) => k.length));
      console.log(pad('skill', w) + '  kind        model              golden  eval  ref  md');
      console.log(pad('-'.repeat(w), w) + '  ----------  -----------------  ------  ----  ---  --');
      for (const [name, m] of rows) {
        console.log(
          pad(name, w) + '  ' + pad(m.kind || '-', 10) + '  ' + pad(m.model || '-', 17) +
          '  ' + pad(m.golden, 6) + '  ' + (m.hasEval ? 'yes' : 'no').padEnd(4) +
          '  ' + (m.hasReference ? 'yes' : 'no').padEnd(3) + '  ' + (m.hasSkillMd ? 'yes' : 'no')
        );
      }
      console.log('');
      console.log(`${rows.length} skills · ${rows.reduce((a, [, m]) => a + m.golden, 0)} golden cases`);
      return;
    }

    case 'validate': {
      const r = skills.validate();
      console.log(JSON.stringify(r, null, 2));
      process.exit(r.ok ? 0 : 1);
      return;
    }

    case 'show': {
      const s = skills.loadSkill(need(rest[0]));
      console.log(`=== ${s.name} ===`);
      console.log('');
      console.log('--- skill.json ---');
      console.log(JSON.stringify(s.meta, null, 2));
      console.log('');
      console.log('--- eval.json ---');
      console.log(JSON.stringify(s.eval, null, 2));
      console.log('');
      console.log(`--- golden.jsonl (${s.golden.length} cases) ---`);
      for (const g of s.golden) console.log(`  ${g.id}  ${JSON.stringify(g.expect)}`);
      return;
    }

    case 'golden': {
      const s = skills.loadSkill(need(rest[0]));
      for (const g of s.golden) console.log(JSON.stringify(g));
      return;
    }

    case 'eval': {
      const name = need(rest[0]);

      const r = await runGolden(name, {});
      console.log(JSON.stringify({ skill: name, summary: r.summary, results: r.results }, null, 2));
      process.exit(r.summary.failed || r.summary.error ? 1 : 0);
      return;
    }

    default:
      usage();
  }
}

main().catch(e => { console.error('skills error:', e.message); process.exit(1); });
