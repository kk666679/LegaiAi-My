#!/usr/bin/env node
import { readJson, writeText } from './_util.js';

'use strict';

const board = readJson('orchestrator/board.json');
const lines = [];
lines.push(`# Sprint Board — ${board.sprint}`);
lines.push('');
lines.push(`State: **${board.state}** · Started: ${board.startedAt}`);
lines.push('');
lines.push('| ID | Title | Owner | Status | Priority |');
lines.push('|---|---|---|---|---|');
for (const it of board.items) {
  lines.push(`| ${it.id} | ${it.title} | ${it.owner} | ${it.status} | ${it.priority} |`);
}
const blocked = board.items.filter(i => i.status === 'blocked');
if (blocked.length) {
  lines.push('');
  lines.push('## Blockers');
  for (const b of blocked) lines.push(`- **${b.id}** — ${b.blocker || 'unspecified'}`);
}
lines.push('');
writeText('orchestrator/board.md', lines.join('\n'));
console.log('board.md written (', board.items.length, 'items )');
