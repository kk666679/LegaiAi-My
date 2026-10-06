#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ROOT, readJson } from './_util.js';

'use strict';

const db = path.join(ROOT, 'vector', 'db.sqlite');
const config = readJson('vector/config.json');
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

function float32Blob(vec) {
  const buf = Buffer.alloc(vec.length * 4);
  vec.forEach((v, i) => buf.writeFloatLE(v, i * 4));
  return 'X' + buf.toString('hex');
}

function usage() {
  console.log([
    'vector — embeddings + preferences',
    '',
    'Usage:',
    '  node bin/vector.js put-embedding <owner> <key> <comma-separated floats>',
    '  node bin/vector.js put-preference <owner> <key> <json>',
    '  node bin/vector.js get-preference <owner> <key>',
    '  node bin/vector.js stats'
  ].join('\n'));
}

try {
  switch (cmd) {
    case 'put-embedding': {
      const [owner, key, csv] = rest;
      if (!owner || !key || !csv) { usage(); process.exit(1); }
      const vec = csv.split(',').map(Number).filter(Number.isFinite);
      if (vec.length !== config.dim) {
        console.error(`vector dim mismatch: got ${vec.length}, expected ${config.dim}`);
        process.exit(1);
      }
      const blob = float32Blob(vec);
      sqlite(
        `INSERT OR REPLACE INTO embeddings (owner,key,dim,model,vector,created_at) VALUES (:owner,:key,:dim,:model,:blob,:now);`,
        { owner, key, dim: config.dim, model: config.model, blob, now: Date.now() }
      );
      console.log('vector put-embedding ->', owner, key);
      break;
    }
    case 'put-preference': {
      const [owner, key, json] = rest;
      if (!owner || !key || !json) { usage(); process.exit(1); }
      JSON.parse(json);
      sqlite(
        `INSERT OR REPLACE INTO preferences (owner,key,value,updated_at) VALUES (:owner,:key,:value,:now);`,
        { owner, key, value: json, now: Date.now() }
      );
      console.log('vector put-preference ->', owner, key);
      break;
    }
    case 'get-preference': {
      const [owner, key] = rest;
      process.stdout.write(sqlite(`SELECT value FROM preferences WHERE owner = :owner AND key = :key;`, { owner, key }));
      break;
    }
    case 'stats': {
      process.stdout.write(sqlite(
        `SELECT 'embeddings' t, count(*) n FROM embeddings UNION ALL SELECT 'preferences', count(*) FROM preferences;`
      ));
      break;
    }
    default: usage();
  }
} catch (err) {
  console.error('vector error:', err.message);
  process.exit(1);
}
