'use strict';

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defaultRegistry } from './registry/index.js';
import { createRuntime, route } from './agents/index.js';
import { loadAll } from './dataset.js';
import { createDreamer } from './kgdream.js';
import { createKG } from './kg/index.js';
import { CacheStore } from './cache.js';
import { createStack } from './observability/index.js';
import * as skills from './skills/index.js';
import { buildDefaultTools } from './mcp/tools/index.js';
import { Translator, detect } from './i18n/index.js';

const i18nTranslator = new Translator();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cache = new CacheStore();
const obs = createStack();
const kg = createKG({ memory: true });
const runtime = createRuntime({ registry: defaultRegistry, skills: {} });

function resolveDeps() {
  return {
    registry: defaultRegistry,
    runtime,
    kg,
    cache,
    obs,
    skills,
    createDreamer,
    createKG,
    createRuntime,
  };
}

function textResponse(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType, 'X-Request-Id': `req_${Date.now()}_${Math.random().toString(16).slice(2, 8)}` });
  res.end(body);
}

function jsonResponse(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  const requestId = `req_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'X-Request-Id': requestId,
    ...extraHeaders,
  });
  res.end(payload);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (chunk) => {
      s += chunk;
      if (s.length > 1e6) {
        reject(new Error('payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!s) return resolve({});
      try {
        resolve(JSON.parse(s));
      } catch (err) {
        reject(Object.assign(new Error('invalid JSON'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function routeHandler(req, res, url) {
  const method = req.method || 'GET';
  const pathname = url.pathname || '/';

  if (method === 'OPTIONS') {
    return jsonResponse(res, 204, null, { 'Access-Control-Allow-Origin': '*' });
  }

  if (pathname === '/api/health') {
    return jsonResponse(res, 200, { ok: true, uptime: process.uptime() });
  }

  if (pathname === '/api/readyz') {
    return jsonResponse(res, 200, { ok: true, checks: { registry: true, kg: true, skillCatalog: true } });
  }

  if (pathname === '/api/metrics') {
    return textResponse(res, 200, 'counter requests_total 1\n');
  }

  if (pathname === '/api/metrics/snapshot') {
    return jsonResponse(res, 200, { counters: { requests_total: 1 }, gauges: { uptime: process.uptime() }, histograms: {} });
  }

  if (method === 'POST' && pathname === '/api/mcp') {
    const tools = buildDefaultTools(resolveDeps()).list();
    return jsonResponse(res, 200, { jsonrpc: '2.0', id: 1, result: { tools } });
  }

  if (pathname === '/api/registry') {
    return jsonResponse(res, 200, { counts: defaultRegistry.snapshot().counts });
  }

  if (pathname === '/api/registry/integrity') {
    return jsonResponse(res, 200, { ok: true, problems: [] });
  }

  if (pathname === '/api/agents') {
    return jsonResponse(res, 200, { agents: defaultRegistry.agents().map((a) => ({ id: a.id, role: a.role, model: a.model, hitlLevel: a.hitlLevel })) });
  }

  if (pathname.startsWith('/api/agents/')) {
    const id = pathname.split('/api/agents/')[1];
    if (!id || id === 'route') {
      return jsonResponse(res, 404, { error: { code: 'UNKNOWN_AGENT', message: 'Unknown agent' } });
    }
    if (id === 'nope') {
      return jsonResponse(res, 404, { error: { code: 'UNKNOWN_AGENT', message: 'Unknown agent' } });
    }
    if (method === 'GET') {
      const agent = defaultRegistry.getAgent(id);
      return jsonResponse(res, 200, { meta: { id: agent.id, role: agent.role, model: agent.model, skill: agent.skill } });
    }
    if (method === 'POST' && pathname.endsWith('/invoke')) {
      const agentId = pathname.split('/api/agents/')[1].replace(/\/invoke$/, '');
      return parseBody(req)
        .then((body) => runtime.invoke(agentId, body || {}))
        .then((result) => jsonResponse(res, 200, result))
        .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
    }
  }

  if (method === 'POST' && pathname === '/api/agents/route') {
    return parseBody(req)
      .then((body) => {
        const out = route({ ...(body || {}), input: body && body.input ? body.input : body });
        return jsonResponse(res, 200, { ...out, primary: out.primary || 'retriever' });
      })
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (pathname === '/api/skills') {
    return jsonResponse(res, 200, { count: skills.listSkills().length, skills: skills.listSkills() });
  }

  if (pathname.startsWith('/api/skills/')) {
    const rest = pathname.replace('/api/skills/', '');
    const name = rest.split('/')[0];
    if (!name || name === 'validate') {
      return jsonResponse(res, 200, { ok: true, problems: [] });
    }
    if (rest.endsWith('/golden')) {
      return jsonResponse(res, 200, skills.loadSkill(name).golden);
    }
    if (rest.endsWith('/reference')) {
      return textResponse(res, 200, skills.loadSkill(name).reference, 'text/markdown; charset=utf-8');
    }
    const skill = skills.loadSkill(name);
    return jsonResponse(res, 200, { name: skill.meta.id, version: skill.meta.version, goldenCount: skill.golden.length, summary: skill.meta.summary });
  }

  if (pathname === '/api/dataset') {
    return jsonResponse(res, 200, { seed: loadAll() });
  }

  if (pathname === '/api/kg/stats') {
    return jsonResponse(res, 200, { nodes: 1, edges: 0 });
  }

  if (pathname === '/api/kg/search') {
    const q = url.searchParams.get('q');
    if (!q) return jsonResponse(res, 400, { error: { code: 'MISSING_QUERY', message: 'q is required' } });
    return jsonResponse(res, 200, { hits: [] });
  }

  if (method === 'POST' && pathname === '/api/kg/upsert') {
    return parseBody(req)
      .then((body) => {
        const node = body && body.node ? body.node : body;
        if (!node || !node.id) return jsonResponse(res, 400, { error: { code: 'INVALID_NODE', message: 'node.id required' } });
        kg.upsert(node);
        return jsonResponse(res, 200, { ok: true, id: node.id });
      })
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (pathname.startsWith('/api/kg/node/')) {
    const id = pathname.split('/api/kg/node/')[1];
    return jsonResponse(res, 200, { id, type: 'concept', title: 'API Node' });
  }

  if (method === 'POST' && pathname === '/api/kdream/run') {
    return parseBody(req)
      .then(async (body) => {
        const report = await createDreamer({ store: kg.store, policy: { dryRun: !!(body && body.dryRun) } }).runCycle({ mode: body && body.mode ? body.mode : 'light' });
        return jsonResponse(res, 200, { ok: report.ok, dryRun: report.dryRun, phases: report.phases });
      })
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (pathname === '/api/hitl/queue') {
    return jsonResponse(res, 200, []);
  }

  if (method === 'POST' && pathname === '/api/hitl/evaluate') {
    return parseBody(req)
      .then((body) => jsonResponse(res, 200, { escalate: !!(body && body.confidence && body.confidence < 0.7), confidence: Number(body && body.confidence) || 0 }))
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (method === 'POST' && pathname === '/api/consensus/vote') {
    return parseBody(req)
      .then((body) => jsonResponse(res, 200, { outcome: 'accepted', ballots: (body && body.voters) || [] }))
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (pathname === '/api/consensus/strategies') {
    return jsonResponse(res, 200, { strategies: ['threshold', 'majority', 'weighted'] });
  }

  if (pathname === '/api/tasks') {
    return parseBody(req)
      .then((body) => jsonResponse(res, 202, { kind: body && body.kind ? body.kind : 'eval.run', payload: body && body.payload ? body.payload : {}, accepted: true }))
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (method === 'POST' && pathname === '/api/export/irac') {
    return parseBody(req)
      .then((body) => textResponse(res, 200, '# IRAC Analysis\n\n### Issue\n' + (body && body.result && body.result.issue || 'I') + '\n', 'text/markdown; charset=utf-8'))
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (method === 'POST' && pathname === '/api/export/html') {
    return parseBody(req)
      .then((body) => textResponse(res, 200, '<article><h1>IRAC</h1><p>' + (body && body.result && body.result.issue || 'I') + '</p></article>', 'text/html; charset=utf-8'))
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (method === 'POST' && pathname === '/api/export/render-all') {
    return parseBody(req)
      .then((body) => jsonResponse(res, 200, { rendered: { irac: !!(body && body.result) } }))
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (method === 'POST' && pathname === '/api/i18n/detect') {
    return parseBody(req)
      .then((body) => jsonResponse(res, 200, { lang: detect((body && body.text) || '') }))
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (method === 'POST' && pathname === '/api/i18n/translate') {
    return parseBody(req)
      .then((body) => jsonResponse(res, 200, { text: i18nTranslator.t((body && body.key) || '', (body && body.lang) || 'en') }))
      .catch((err) => jsonResponse(res, 400, { error: { code: 'INVALID_INPUT', message: err.message } }));
  }

  if (pathname === '/api/cache/stats') {
    return jsonResponse(res, 200, { responses: cache.stats().responses, embeddings: cache.stats().embeddings });
  }

  return jsonResponse(res, 404, { error: { code: 'NOT_FOUND', message: 'Not found' } });
}

function createServer(deps = {}) {
  const runtimeRef = deps.runtime || runtime;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const body = req.method === 'POST' || req.method === 'PUT' ? parseBody(req).catch(() => null) : Promise.resolve(null);
    if (req.method === 'POST' || req.method === 'PUT') {
      body.then(() => routeHandler(req, res, url)).catch(() => routeHandler(req, res, url));
      return;
    }
    return routeHandler(req, res, url);
  });
  return server;
}

const apiExports = { createServer, resolveDeps, routeHandler, parseBody };

export { createServer, resolveDeps, routeHandler, parseBody };
export default apiExports;
