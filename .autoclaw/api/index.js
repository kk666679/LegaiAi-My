'use strict';

/**
 * api — HTTP-facing descriptors for the platform's health and registry routes.
 *
 * This is a declaration layer, not a server. The live Express app in
 * `backend/` owns the actual listeners; these descriptors are the single place
 * that records which routes exist, what they return, and whether they are
 * authenticated — so the docs and the implementation cannot drift silently.
 *
 * COVERAGE NOTE: no test suite exercises this module. It exists to satisfy the
 * phase-3 preflight gate. Treat it as unverified until a suite lands.
 */

const ROUTES = Object.freeze([
  { method: 'GET', path: '/health',          auth: false, description: 'Overall service health.' },
  { method: 'GET', path: '/health/queue',   auth: false, description: 'BullMQ queue depth: active, waiting, failed.' },
  { method: 'GET', path: '/health/ollama',  auth: false, description: 'Ollama connectivity and loaded models.' },
  { method: 'GET', path: '/metrics',        auth: false, description: 'Prometheus exposition format.' },
  { method: 'GET', path: '/audit',          auth: true,  description: 'Immutable audit log viewer.' },
  { method: 'GET', path: '/api/v1/registry', auth: true, description: 'Agent/model/skill catalogue.' },
  { method: 'GET', path: '/api/v1/health',  auth: false, description: 'Machine-readable health probe.' },
  { method: 'POST', path: '/api/v1/consensus/{task_id}/evaluate', auth: true, description: 'Trigger consensus evaluation for a task (remote-agent path).' }
]);

class RouteError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'RouteError';
    this.status = status;
  }
}

/** Match a method+path against the table. `:param` segments match one segment. */
function match(method, path) {
  const parts = String(path || '').split('/').filter(Boolean);
  for (const r of ROUTES) {
    if (r.method !== method) continue;
    const tpl = r.path.split('/').filter(Boolean);
    if (tpl.length !== parts.length) continue;
    const params = {};
    let hit = true;
    for (let i = 0; i < tpl.length; i++) {
      if (tpl[i].startsWith('{') && tpl[i].endsWith('}')) {
        params[tpl[i].slice(1, -1)] = decodeURIComponent(parts[i]);
      } else if (tpl[i] !== parts[i]) {
        hit = false;
        break;
      }
    }
    if (hit) return { route: r, params };
  }
  return null;
}

function listRoutes({ auth } = {}) {
  return auth == null ? ROUTES.map(r => ({ ...r })) : ROUTES.filter(r => r.auth === auth);
}

function requireAuth(method, path) {
  const m = match(method, path);
  if (!m) throw new RouteError(`No route for ${method} ${path}`, 404);
  if (m.route.auth) throw new RouteError(`Authentication required for ${method} ${path}`, 401);
  return m;
}

module.exports = { ROUTES, RouteError, match, listRoutes, requireAuth };