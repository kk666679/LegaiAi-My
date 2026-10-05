'use strict';

class ResourceRegistry {
  constructor() { this.static = new Map(); this.templates = []; }

  register(resource) {
    if (!resource || !resource.uri || typeof resource.read !== 'function') {
      throw new Error('Resource must be { uri, name, read() }');
    }
    this.static.set(resource.uri, resource);
    return this;
  }
  registerTemplate(uriTemplate, resource) {
    if (!uriTemplate || typeof resource.read !== 'function') throw new Error('Template must be { uriTemplate, read() }');
    this.templates.push({ uriTemplate, resource });
    return this;
  }

  size() { return this.static.size + this.templates.length; }

  list() {
    const out = [];
    for (const r of this.static.values()) out.push({ uri: r.uri, name: r.name, description: r.description, mimeType: r.mimeType || 'application/json' });
    for (const { uriTemplate, resource } of this.templates) out.push({ uri: uriTemplate, name: resource.name, description: resource.description, mimeType: resource.mimeType || 'application/json' });
    return out;
  }

  _match(uri) {
    for (const { uriTemplate, resource } of this.templates) {
      const names = [];
      const re = new RegExp('^' + uriTemplate.replace(/\{([^}]+)\}/g, (_, n) => { names.push(n); return '([^/]+)'; }) + '$');
      const m = uri.match(re);
      if (m) { const vars = {}; names.forEach((n, i) => { vars[n] = decodeURIComponent(m[i + 1]); }); return { resource, vars }; }
    }
    return null;
  }

  async read(uri) {
    if (this.static.has(uri)) {
      const r = this.static.get(uri);
      const body = await r.read();
      return { contents: [{ uri, mimeType: r.mimeType || 'application/json', text: typeof body === 'string' ? body : JSON.stringify(body, null, 2) }] };
    }
    const t = this._match(uri);
    if (t) {
      const body = await t.resource.read(uri, t.vars);
      if (body == null) return null;
      return { contents: [{ uri, mimeType: t.resource.mimeType || 'application/json', text: typeof body === 'string' ? body : JSON.stringify(body, null, 2) }] };
    }
    return null;
  }
}

/* ── Default resources ── */
function buildDefaultResources(deps = {}) {
  const { registry, agents, kg, cache, obs } = deps;
  const rr = new ResourceRegistry();

  rr.register({ uri: 'autoclaw://health', name: 'Health', mimeType: 'application/json',
    read: () => ({ ok: true, ts: Date.now(), version: '2.0.0' }) });

  rr.register({ uri: 'autoclaw://registry', name: 'Registry snapshot', mimeType: 'application/json',
    read: () => registry ? registry.snapshot() : { error: 'registry unavailable' } });

  rr.register({ uri: 'autoclaw://registry/agents', name: 'Registry agents', mimeType: 'application/json',
    read: () => registry ? registry.listAgents() : [] });

  rr.register({ uri: 'autoclaw://registry/models', name: 'Registry models', mimeType: 'application/json',
    read: () => registry ? registry.listModels() : [] });

  rr.register({ uri: 'autoclaw://registry/skills', name: 'Registry skills', mimeType: 'application/json',
    read: () => registry ? registry.listSkills() : [] });

  rr.register({ uri: 'autoclaw://agents', name: 'Agents runtime', mimeType: 'application/json',
    read: () => agents ? { agents: agents.list(), stats: agents.stats() } : { error: 'agents unavailable' } });

  rr.register({ uri: 'autoclaw://skills', name: 'Skill envelopes', mimeType: 'application/json',
    read: () => { try { return require('../skills').counts(); } catch (_) { return { error: 'skills unavailable' }; } } });

  rr.register({ uri: 'autoclaw://dataset', name: 'Dataset counts', mimeType: 'application/json',
    read: () => { try { return require('../dataset').counts(); } catch (_) { return { error: 'dataset unavailable' }; } } });

  rr.register({ uri: 'autoclaw://kdream/memory', name: 'Consolidated memory', mimeType: 'text/markdown',
    read: () => { try { const k = require('../kdream'); return k.createDreamer().readMemory() || '# (empty)'; } catch (_) { return '# (kdream unavailable)'; } } });

  rr.register({ uri: 'autoclaw://cache/stats', name: 'Cache stats', mimeType: 'application/json',
    read: () => cache ? cache.stats() : { error: 'cache unavailable' } });

  rr.register({ uri: 'autoclaw://metrics', name: 'Metrics (Prometheus)', mimeType: 'text/plain',
    read: () => obs && obs.metrics ? obs.metrics.renderPrometheus() : '# metrics unavailable\n' });

  rr.registerTemplate('autoclaw://kg/node/{id}', {
    name: 'KG node', mimeType: 'application/json',
    read: async (_uri, { id }) => { if (!kg) return { error: 'kg unavailable' }; const n = await kg.getNode(id); return n || { error: `not found: ${id}` }; }
  });

  rr.registerTemplate('autoclaw://skills/{name}', {
    name: 'Skill envelope', mimeType: 'application/json',
    read: async (_uri, { name }) => { try { return require('../skills').loadSkill(name); } catch (e) { return { error: e.message }; } }
  });

  return rr;
}

module.exports = { ResourceRegistry, buildDefaultResources };
