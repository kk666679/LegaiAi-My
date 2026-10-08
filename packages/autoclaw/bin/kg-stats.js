#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { ROOT } from './_util.js';
import { createKG } from '../kg/index.js';

'use strict';

/**
 * kg-stats — node/edge census as JSON.
 *
 * `bin/kg.js` is the mutation surface (add-node, add-edge, get, stats).
 * This one reports which backend answered and the type breakdown — it falls
 * back to the memory backend and says so, so a missing `kg.db` is visible in
 * the output rather than silent.
 */

const dbPath = path.join(ROOT, 'kg', 'kg.db');
const forceMemory = process.argv.includes('--memory');
const missing = !fs.existsSync(dbPath);

const kg = createKG(forceMemory || missing ? { memory: true } : { dbPath });

(async () => {
  if (kg.backend === 'memory' && !forceMemory && missing) {
    await kg.upsert({ id: 'example:node', type: 'concept', title: 'Example', salience: 0.5 });
  }
  console.log(JSON.stringify({
    backend: kg.backend,
    dbPath: kg.backend === 'sqlite' ? dbPath : null,
    reason: missing && !forceMemory ? 'kg.db absent — memory backend' : null,
    ...kg.stats()
  }, null, 2));
})().catch(e => { console.error('kg-stats error:', e.message); process.exit(1); });
