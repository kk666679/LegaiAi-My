#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ROOT } from './_util.js';

'use strict';

const db = path.join(ROOT, 'spine', 'spine.db');
const [, , cmd, ...rest] = process.argv;

function sqlite(sql, params = {}) {
  const inlined = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    const v = params[name];
    if (v === undefined || v === null) return 'NULL';
    if (typeof v === 'number') return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  });
  return execFileSync('sqlite3', [db], { input: inlined, encoding: 'utf8' });
}

function usage() {
  console.log([
    'spine — durable run spine',
    '',
    'Usage:',
    '  node bin/spine.js open <runId> <workflow> [agent] [sprint]',
    '  node bin/spine.js event <runId> <kind> [payload]',
    '  node bin/spine.js decide <runId> <actor> <decision> [rationale]',
    '  node bin/spine.js close <runId> <status>',
    '  node bin/spine.js get <runId>',
    '  node bin/spine.js stats'
  ].join('\n'));
}

try {
  switch (cmd) {
    case 'open': {
      const [runId, workflow, agent, sprint] = rest;
      if (!runId || !workflow) { usage(); process.exit(1); }
      sqlite(
        `INSERT OR REPLACE INTO runs (id,workflow,agent,sprint,started_at,status) VALUES (:id,:workflow,:agent,:sprint,:now,'running');`,
        { id: runId, workflow, agent: agent || null, sprint: sprint || null, now: Date.now() }
      );
      console.log('spine open ->', runId);
      break;
    }
    case 'event': {
      const [runId, kind, payload] = rest;
      sqlite(
        `INSERT INTO events (run_id, ts, kind, payload) VALUES (:runId,:ts,:kind,:payload);`,
        { runId, ts: Date.now(), kind, payload: payload || null }
      );
      console.log('spine event ->', kind);
      break;
    }
    case 'decide': {
      const [runId, actor, decision, rationale] = rest;
      sqlite(
        `INSERT INTO decisions (run_id, ts, actor, decision, rationale) VALUES (:runId,:ts,:actor,:decision,:rationale);`,
        { runId, ts: Date.now(), actor, decision, rationale: rationale || null }
      );
      console.log('spine decide ->', decision);
      break;
    }
    case 'close': {
      const [runId, status] = rest;
      sqlite(`UPDATE runs SET ended_at = :now, status = :status WHERE id = :runId;`,
        { runId, status: status || 'ok', now: Date.now() });
      console.log('spine close ->', runId, status || 'ok');
      break;
    }
    case 'get': {
      const runId = rest[0];
      process.stdout.write(sqlite(`SELECT * FROM runs WHERE id = :runId;`, { runId }));
      break;
    }
    case 'stats': {
      process.stdout.write(sqlite(`SELECT status, count(*) FROM runs GROUP BY status;`));
      break;
    }
    default: usage();
  }
} catch (err) {
  console.error('spine error:', err.message);
  process.exit(1);
}
