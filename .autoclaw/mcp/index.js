import { createRequire } from 'node:module';
import * as protocol from './protocol.js';
import { McpServer } from './server.js';
import { StdioTransport } from './transport/stdio.js';
import { HttpTransport } from './transport/http.js';
import { ToolRegistry, buildDefaultTools, fromSkillId, isValidName, inferInputSchema } from './tools/index.js';
import { ResourceRegistry, buildDefaultResources } from './resources.js';
import { PromptRegistry, buildDefaultPrompts } from './prompts.js';
import { buildCapabilities } from './capabilities.js';
import path from 'path';
import fs from 'fs';

import { createKG } from '../kg/index.js';

const require = createRequire(import.meta.url);

/**
 * createServer — assemble a server, resolving default deps from siblings.
 * Callers can override any dep.
 */
function createServer(deps = {}) {
  const resolved = { ...deps };

  if (!resolved.registry) {
    try { resolved.registry = require('../registry').defaultRegistry; } catch (_) {}
  }
  if (!resolved.agents) {
    try { resolved.agents = require('../agents').createRuntime({ registry: resolved.registry, skills: deps.skills || {} }); } catch (_) {}
  }
  if (!resolved.cache) {
    try { const { CacheStore } = require('../cache'); resolved.cache = new CacheStore(); } catch (_) {}
  }
  if (!resolved.hitl) {
    try { resolved.hitl = require('../hitl').createHITL(); } catch (_) {}
  }
  if (!resolved.consensus) {
    try { const { Consensus, alwaysYes, alwaysNo, alwaysAbstain } = require('../consensus');
      const c = new Consensus({ strategy: 'threshold' });
      c.registerVoter('validator-a', alwaysYes(0.9));
      c.registerVoter('validator-b', alwaysYes(0.85));
      c.registerVoter('validator-c', alwaysAbstain());
      resolved.consensus = c; } catch (_) {}
  }
  if (!resolved.tasks) {
    try { const { TaskRunner, defaultHandlers } = require('../tasks');
      const r = new TaskRunner();
      Object.entries(defaultHandlers({})).forEach(([k, h]) => r.register(k, h));
      resolved.tasks = r; } catch (_) {}
  }
  if (!resolved.kg) {
    try {
      const dbPath = path.resolve(import.meta.dirname, '..', 'kg', 'kg.db');

      resolved.kg = fs.existsSync(dbPath) ? createKG({ dbPath }) : createKG({ memory: true });
    } catch (_) {}
  }
  if (!resolved.obs) {
    try { resolved.obs = require('../observability').createStack(); } catch (_) {}
  }
  return new McpServer(resolved);
}

function serveStdio(deps = {}, opts = {}) {
  const server = deps.server || createServer(deps);
  const transport = new StdioTransport(opts);
  server.bind(transport);
  return { server, transport, stop: () => transport.close() };
}

function serveHttp(deps = {}, opts = {}) {
  const server = deps.server || createServer(deps);
  const transport = new HttpTransport(opts);
  transport.on('message', async msg => { const r = await server.handleMessage(msg); if (r) transport.reply(r); });
  transport.on('parseError', info => transport.reply(protocol.errorResponse(null, protocol.ERROR_CODES.PARSE_ERROR, 'Parse error', { line: info.line })));
  return { server, transport, handler: transport.handler() };
}

;

export { McpServer, StdioTransport, HttpTransport, ToolRegistry, buildDefaultTools, fromSkillId, isValidName, inferInputSchema, ResourceRegistry, buildDefaultResources, PromptRegistry, buildDefaultPrompts, buildCapabilities, createServer, serveStdio, serveHttp, protocol };
