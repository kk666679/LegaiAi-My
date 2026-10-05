#!/usr/bin/env node
'use strict';
const ds = require('../dataset');
const cmd = process.argv[2] || 'validate';
if (cmd === 'validate') {
  const r = ds.validate();
  console.log(JSON.stringify({ ok: r.ok, problems: r.problems, counts: r.counts }, null, 2));
  if (!r.ok) process.exit(1);
} else if (cmd === 'counts') {
  console.log(JSON.stringify(ds.counts(), null, 2));
} else if (cmd === 'list') {
  const all = ds.loadAll();
  for (const [g, files] of Object.entries(all)) {
    console.log(`${g}/`);
    for (const [k, v] of Object.entries(files)) console.log(`  ${k}: ${v.length} records`);
  }
} else {
  console.log('usage: node bin/dataset.js validate|counts|list');
  process.exit(1);
}
