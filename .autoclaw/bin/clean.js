#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./_util');

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
