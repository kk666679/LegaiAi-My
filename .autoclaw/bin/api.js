#!/usr/bin/env node
'use strict';

const { serve, createRouter } = require('../api');

const cmd = process.argv[2] || 'serve';

if (cmd === 'list') {
const router = createRouter({});
for (const route of router.list()) console.log(' ' + route);
console.log(\n${router.list().length} routes);
return;
}

if (cmd === 'serve') {
const port = Number(process.argv[3]) || 7332;
const s = serve({});
s.listen(port, addr => {
process.stdout.write(api listening on http://127.0.0.1:${addr.port}\n);
process.stdout.write(health: GET http://127.0.0.1:${addr.port}/api/health\n);
process.stdout.write(readyz: GET http://127.0.0.1:${addr.port}/api/readyz\n);
process.stdout.write(metrics: GET http://127.0.0.1:${addr.port}/api/metrics\n);
process.stdout.write(registry: GET http://127.0.0.1:${addr.port}/api/registry\n);
});
const shutdown = () => { s.close(() => process.exit(0)); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
return;
}

console.log([
'api — Autoclaw HTTP API',
'',
'Usage:',
' node bin/api.js serve [port]',
' node bin/api.js list'
].join('\n'));
