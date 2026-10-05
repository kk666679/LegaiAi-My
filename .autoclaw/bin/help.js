#!/usr/bin/env node
'use strict';
const pkg = require('../package.json');
const lines = [
  `${pkg.name} v${pkg.version}`,
  '',
  'Scripts:',
  ...Object.entries(pkg.scripts).map(([k, v]) => `  npm run ${k.padEnd(10)} — ${v}`),
  '',
  'All commands are Node.js programs. No shell scripts are invoked.'
];
console.log(lines.join('\n'));
