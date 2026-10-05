#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, writeJson, nowIso } = require('./_util');

const archiveDir = path.join(ROOT, 'orchestrator', 'comms', 'inboxes', '_archive');
const sharedDir  = path.join(ROOT, 'orchestrator', 'comms', 'inboxes', 'shared');
fs.mkdirSync(archiveDir, { recursive: true });
fs.mkdirSync(sharedDir,  { recursive: true });

let archived = 0, freed = 0;
for (const name of fs.readdirSync(sharedDir)) {
  if (name === '.keep') continue;
  const src = path.join(sharedDir, name);
  const dst = path.join(archiveDir, name);
  const stat = fs.statSync(src);
  fs.renameSync(src, dst);
  archived++;
  freed += stat.size;
}

writeJson('orchestrator/comms/_gc/last-run.json', {
  ranAt: nowIso(),
  archivedInboxes: archived,
  freedBytes: freed,
  nextRunAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
});
console.log('gc -> archived', archived, '(', freed, 'bytes )');
