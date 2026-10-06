#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { ROOT } from './_util.js';

'use strict';

const targets = [
  'kg/kg.db','kg/kg.db-shm','kg/kg.db-wal',
  'spine/spine.db','spine/spine.db-shm','spine/spine.db-wal',
  'vector/db.sqlite'
];

let removed = 0;
for (const rel of targets) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs)) { fs.rmSync(abs); removed++; }
}
console.log('clean -> removed', removed, 'file(s)');
