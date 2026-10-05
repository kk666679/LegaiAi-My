'use strict';

const { McpServer } = require('./server');
const { StdioTransport } = require('./transport/stdio');
const { HttpTransport } = require('./transport/http');
const { ToolRegistry, buildDefaultTools, fromSkillId, isValidName, inferInputSchema } = require('./tools');
const { ResourceRegistry, buildDefaultResources } = require('./resources');
const { PromptRegistry, buildDefaultPrompts } = require('./prompts');
const protocol = require('./protocol');
const { buildCapabilities } = require('./capabilities');

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
      const path = require('path');
      const fs = require('fs');
      const dbPath = path.resolve(__dirname, '..', 'kg', 'kg.db');
      const { createKG } = require('../kg');
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

module.exports = {
  McpServer,
  StdioTransport, HttpTransport,
  ToolRegistry, buildDefaultTools, fromSkillId, isValidName, inferInputSchema,
  ResourceRegistry, buildDefaultResources,
  PromptRegistry, buildDefaultPrompts,
  buildCapabilities,
  createServer, serveStdio, serveHttp,
  protocol
};
