#!/usr/bin/env node
import { createMemory } from '../memory.js';

'use strict';

const cmd = process.argv[2] || 'status';
const mem = createMemory({});

if (cmd === 'status') {
  console.log(JSON.stringify(mem.stats(), null, 2));
} else if (cmd === 'recent') {
  const sessionId = process.argv[3] || 'default';
  const limit = Number(process.argv[4]) || 10;
  console.log(JSON.stringify(mem.recent(sessionId, { limit }), null, 2));
} else if (cmd === 'query') {
  const q = process.argv[3] || '';
  const sessionId = process.argv[4] || 'default';
  console.log(JSON.stringify(mem.query({ sessionId, q, limit: 10 }), null, 2));
} else if (cmd === 'commit') {
  const text = process.argv[3] || '';
  const tags = process.argv[4] ? process.argv[4].split(',') : [];
  const kind = process.argv[5] || 'note';
  const e = mem.commit({ text, tags, kind, salience: 0.7 });
  mem.flush();
  console.log(JSON.stringify(e, null, 2));
} else if (cmd === 'promote') {
  const sessionId = process.argv[3] || 'default';
  const r = mem.promoteByRepetition({ sessionId, minOccurrences: 2 });
  mem.flush();
  console.log(JSON.stringify({ promoted: r.count, ids: r.promoted.map(e => e.id) }, null, 2));
} else if (cmd === 'decay') {
  const r = mem.decay({ factor: 0.95 });
  mem.flush();
  console.log(JSON.stringify(r, null, 2));
} else if (cmd === 'compact') {
  mem.flush();
  const r = mem.compact();
  console.log(JSON.stringify(r, null, 2));
} else {
  console.log([
    'memory — LTM + STM CLI',
    '',
    'Usage:',
    '  node bin/memory.js status',
    '  node bin/memory.js recent [sessionId] [limit]',
    '  node bin/memory.js query <q> [sessionId]',
    '  node bin/memory.js commit <text> [tags] [kind]',
    '  node bin/memory.js promote [sessionId]',
    '  node bin/memory.js decay',
    '  node bin/memory.js compact'
  ].join(String.fromCharCode(10)));
}
