#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, nowIso } = require('./_util');

const db = path.join(ROOT, 'kg', 'kg.db');
const [, , cmd, ...rest] = process.argv;

function sqlite(sql, params = {}) {
  const args = [db];
  const inlined = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    const v = params[name];
    if (v === undefined || v === null) return 'NULL';
    if (typeof v === 'number') return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  });
  return execFileSync('sqlite3', args, { input: inlined, encoding: 'utf8' });
}

function usage() {
  console.log([
    'kg — knowledge graph CLI',
    '',
    'Usage:',
    '  node bin/kg.js add-node <id> <type> <title> [canonical]',
    '  node bin/kg.js add-edge <id> <from> <to> <rel> [weight]',
    '  node bin/kg.js get <id>',
    '  node bin/kg.js stats'
  ].join('\n'));
}

try {
  switch (cmd) {
    case 'add-node': {
      const [id, type, title, canonical] = rest;
      if (!id || !type || !title) { usage(); process.exit(1); }
      const now = Date.now();
      sqlite(
        `INSERT OR REPLACE INTO nodes (id,type,title,canonical,created_at,updated_at) VALUES (:id,:type,:title,:canonical,:now,:now);`,
        { id, type, title, canonical: canonical || title.toLowerCase(), now }
      );
      console.log('kg add-node ->', id);
      break;
    }
    case 'add-edge': {
      const [id, from, to, rel, weight] = rest;
      if (!id || !from || !to || !rel) { usage(); process.exit(1); }
      const w = Number(weight) || 0.5;
      const now = Date.now();
      sqlite(
        `INSERT OR REPLACE INTO edges (id,from_id,to_id,rel,weight,created_at,updated_at) VALUES (:id,:from,:to,:rel,:w,:now,:now);`,
        { id, from, to, rel, w, now }
      );
      console.log('kg add-edge ->', id);
      break;
    }
    case 'get': {
      const id = rest[0];
      if (!id) { usage(); process.exit(1); }
      process.stdout.write(sqlite(`SELECT * FROM nodes WHERE id = :id;`, { id }));
      break;
    }
    case 'stats': {
      process.stdout.write(sqlite(`SELECT 'nodes' t, count(*) n FROM nodes UNION ALL SELECT 'edges', count(*) FROM edges;`));
      break;
    }
    default: usage();
  }
} catch (err) {
  console.error('kg error:', err.message);
  process.exit(1);
}
