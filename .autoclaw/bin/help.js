#!/usr/bin/env node
import pkg from '../package.json';

'use strict';

const lines = [
  `${pkg.name} v${pkg.version}`,
  '',
  'Scripts:',
  ...Object.entries(pkg.scripts).map(([k, v]) => `  npm run ${k.padEnd(10)} — ${v}`),
  '',
  'All commands are Node.js programs. No shell scripts are invoked.'
];
console.log(lines.join('\n'));
