import fs from 'fs';
import { execFileSync } from 'child_process';
import { KGQuery } from './query.js';

/**
 * store — two interchangeable backends behind one interface.
 *
 *   SQLiteStore  — production. `kg/kg.db`, schema in `schema.sql`.
 *   MemoryStore  — tests and dev. Same method surface, no sqlite3 needed.
 *
 * The interface is the contract `kgdream` was written against: listNodes,
 * getNode, upsert, removeNode, listEdges, getEdge, neighbours, putEdge,
 * removeEdge, search, stats. Both backends implement all of it, so either can
 * be handed to a phase function without a conditional.
 *
 * There is no `sqlite3` node binding in this project — the SQLite backend
 * shells out to the `sqlite3` CLI. `openStore` degrades to MemoryStore rather
 * than throwing, so a missing binary costs persistence, not availability.
 */

/* ── SQL inlining ──
 * Values are inlined rather than bound because the `sqlite3` CLI has no bind
 * API. Every value goes through `quote()`, which doubles single quotes; all
 * interpolation happens on named `:params` only, never on raw input. */

function quote(v) {
  if (v === undefined || v === null) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function substitute(sql, params = {}) {
  return sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => quote(params[name]));
}

class SQLiteStore {
  constructor({ dbPath, logger } = {}) {
    if (!dbPath) throw new Error('SQLiteStore requires { dbPath }');
    if (!fs.existsSync(dbPath)) throw new Error(`SQLiteStore: db not found at ${dbPath} (run npm run init)`);
    this.dbPath = dbPath;
    this.logger = logger || null;
    this._ensureSchema();
  }

  _run(sql, params = {}) {
    return execFileSync('sqlite3', [this.dbPath], { input: substitute(sql, params) + '\n', encoding: 'utf8' });
  }

  _rows(sql, params = {}) {
    const script = '.mode json\n' + substitute(sql, params).replace(/;?\s*$/, ';') + '\n';
    const out = execFileSync('sqlite3', [this.dbPath], { input: script, encoding: 'utf8' }).trim();
    if (!out) return [];
    try { return JSON.parse(out); } catch { return []; }
  }

  /** Idempotent migration: `meta` (tags + mergedFrom) was added after v1. */
  _ensureSchema() {
    const cols = this._rows('PRAGMA table_info(nodes)');
    if (!cols.some(c => c.name === 'meta')) {
      this._run('ALTER TABLE nodes ADD COLUMN meta TEXT');
      if (this.logger) this.logger.info('kg.migrate', { added: 'nodes.meta' });
    }
  }

  _rowToNode(r) {
    let meta = null;
    if (r.meta) { try { meta = JSON.parse(r.meta); } catch { meta = null; } }
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      canonical: r.canonical,
      body: r.body || null,
      salience: Number(r.salience),
      accessCount: Number(r.access_count) || 0,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      lastSeen: r.last_seen || null,
      mergedFrom: (meta && meta.mergedFrom) || undefined,
      tags: (meta && Array.isArray(meta.tags)) ? meta.tags : []
    };
  }

  _rowToEdge(r) {
    return {
      id: r.id,
      from: r.from_id,
      to: r.to_id,
      rel: r.rel,
      weight: Number(r.weight),
      inferred: !!r.inferred,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  /* ── nodes ── */

  async listNodes({ limit = 200, type, tag } = {}) {
    const n = clampLimit(limit, 200, 5000);
    let sql = 'SELECT * FROM nodes';
    if (type) sql += ` WHERE type = ${quote(type)}`;
    sql += ` ORDER BY salience DESC, updated_at DESC LIMIT ${n}`;
    let rows = this._rows(sql).map(r => this._rowToNode(r));
    if (tag) rows = rows.filter(r => (r.tags || []).includes(tag));
    return rows;
  }

  async getNode(id) {
    const rows = this._rows('SELECT * FROM nodes WHERE id = :id', { id });
    return rows[0] ? this._rowToNode(rows[0]) : null;
  }

  async upsert(node) {
    if (!node || !node.id) throw new Error('upsert requires { id }');
    const now = Date.now();
    const existing = this._rowToNode((this._rows('SELECT * FROM nodes WHERE id = :id', { id: node.id })[0]) || { id: node.id, type: node.type, title: node.title, canonical: node.canonical, body: '', salience: 0.5, access_count: 0, created_at: now, updated_at: now, last_seen: now, meta: null });
    const meta = JSON.stringify({
      mergedFrom: node.mergedFrom || existing.mergedFrom,
      tags: Array.isArray(node.tags) ? node.tags : (existing.tags || [])
    });
    this._run(
      `INSERT INTO nodes (id, type, title, canonical, body, salience, access_count, created_at, updated_at, last_seen, meta)
       VALUES (:id, :type, :title, :canonical, :body, :salience, :access_count, :created_at, :updated_at, :last_seen, :meta)
       ON CONFLICT(id) DO UPDATE SET
         type=excluded.type, title=excluded.title, canonical=excluded.canonical,
         body=excluded.body, salience=excluded.salience, access_count=excluded.access_count,
         updated_at=excluded.updated_at, last_seen=excluded.last_seen, meta=excluded.meta`,
      {
        id: node.id,
        type: node.type || 'concept',
        title: node.title || node.id,
        canonical: node.canonical || String(node.title || node.id).toLowerCase(),
        body: node.body != null ? node.body : existing.body,
        salience: Number(node.salience != null ? node.salience : existing.salience) || 0.5,
        access_count: Number(node.accessCount != null ? node.accessCount : existing.accessCount) || 0,
        created_at: existing.createdAt || now,
        updated_at: node.updatedAt || now,
        last_seen: node.lastSeen || now,
        meta
      }
    );
    return node;
  }

  async removeNode(id) {
    this._run('DELETE FROM nodes WHERE id = :id', { id });
    return true;
  }

  /* ── edges ── */

  async listEdges({ limit = 500, rel, from, to } = {}) {
    const n = clampLimit(limit, 500, 10000);
    const where = [];
    if (rel) where.push(`rel = ${quote(rel)}`);
    if (from) where.push(`from_id = ${quote(from)}`);
    if (to) where.push(`to_id = ${quote(to)}`);
    const sql = 'SELECT * FROM edges' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ` LIMIT ${n}`;
    return this._rows(sql).map(r => this._rowToEdge(r));
  }

  async getEdge(id) {
    const rows = this._rows('SELECT * FROM edges WHERE id = :id', { id });
    return rows[0] ? this._rowToEdge(rows[0]) : null;
  }

  async neighbours(id, { limit = 20, rel } = {}) {
    const n = clampLimit(limit, 20, 500);
    const relClause = rel ? ` AND rel = ${quote(rel)}` : '';
    const rows = this._rows(
      `SELECT * FROM edges WHERE (from_id = :id OR to_id = :id)${relClause} LIMIT ${n}`,
      { id }
    );
    return rows.map(r => {
      const e = this._rowToEdge(r);
      return { id: e.from === id ? e.to : e.from, edgeId: e.id, rel: e.rel, weight: e.weight, inferred: e.inferred };
    });
  }

  async putEdge(edge) {
    if (!edge || !edge.id) throw new Error('putEdge requires { id }');
    const now = Date.now();
    this._run(
      `INSERT INTO edges (id, from_id, to_id, rel, weight, inferred, created_at, updated_at)
       VALUES (:id, :from_id, :to_id, :rel, :weight, :inferred, :created_at, :updated_at)
       ON CONFLICT(id) DO UPDATE SET
         weight=excluded.weight, inferred=excluded.inferred, updated_at=excluded.updated_at`,
      {
        id: edge.id,
        from_id: edge.from || edge.from_id,
        to_id: edge.to || edge.to_id,
        rel: edge.rel || 'related',
        weight: Number(edge.weight) || 0.5,
        inferred: edge.inferred ? 1 : 0,
        created_at: edge.createdAt || now,
        updated_at: edge.updatedAt || now
      }
    );
    return edge;
  }

  async removeEdge(id) {
    this._run('DELETE FROM edges WHERE id = :id', { id });
    return true;
  }

  /* ── query + stats (kgdream calls store.search directly) ── */

  search(opts) {
    if (!this._query) this._query = new KGQuery(this);
    return this._query.search(opts);
  }

  stats() {
    const n = (this._rows('SELECT COUNT(*) AS n FROM nodes')[0] || {}).n || 0;
    const e = (this._rows('SELECT COUNT(*) AS n FROM edges')[0] || {}).n || 0;
    const byType = {};
    for (const r of this._rows('SELECT type, COUNT(*) AS n FROM nodes GROUP BY type')) byType[r.type] = r.n;
    return { nodes: n, edges: e, byType };
  }

  close() { /* every call is a short-lived `sqlite3` process — nothing to close */ }
}

class MemoryStore {
  constructor() { this.nodesMap = new Map(); this.edgesMap = new Map(); }

  async listNodes({ limit = 200, type, tag } = {}) {
    let out = [...this.nodesMap.values()];
    if (type) out = out.filter(n => n.type === type);
    if (tag) out = out.filter(n => (n.tags || []).includes(tag));
    out.sort((a, b) => ((b.salience || 0) - (a.salience || 0)) || ((b.updatedAt || 0) - (a.updatedAt || 0)));
    return out.slice(0, limit);
  }

  async getNode(id) { return this.nodesMap.get(id) || null; }

  async upsert(node) {
    if (!node || !node.id) throw new Error('upsert requires { id }');
    const existing = this.nodesMap.get(node.id) || {};
    const now = Date.now();
    const merged = {
      ...existing,
      ...node,
      createdAt: node.createdAt || existing.createdAt || now,
      updatedAt: node.updatedAt || now,
      lastSeen: node.lastSeen || existing.lastSeen || now,
      salience: Number(node.salience != null ? node.salience : existing.salience) || 0.5,
      accessCount: Number(node.accessCount != null ? node.accessCount : existing.accessCount) || 0,
      tags: Array.isArray(node.tags) ? node.tags : (existing.tags || [])
    };
    this.nodesMap.set(node.id, merged);
    return merged;
  }

  async removeNode(id) { return this.nodesMap.delete(id); }

  async listEdges({ limit = 500, rel, from, to } = {}) {
    let out = [...this.edgesMap.values()];
    if (rel) out = out.filter(e => e.rel === rel);
    if (from) out = out.filter(e => e.from === from);
    if (to) out = out.filter(e => e.to === to);
    return out.slice(0, limit);
  }

  async getEdge(id) { return this.edgesMap.get(id) || null; }

  async neighbours(id, { limit = 20, rel } = {}) {
    const out = [];
    for (const e of this.edgesMap.values()) {
      if (rel && e.rel !== rel) continue;
      if (e.from === id) out.push({ id: e.to, edgeId: e.id, rel: e.rel, weight: e.weight, inferred: !!e.inferred });
      else if (e.to === id) out.push({ id: e.from, edgeId: e.id, rel: e.rel, weight: e.weight, inferred: !!e.inferred });
      if (out.length >= limit) break;
    }
    return out;
  }

  async putEdge(edge) {
    if (!edge || !edge.id) throw new Error('putEdge requires { id }');
    const now = Date.now();
    const merged = {
      ...(this.edgesMap.get(edge.id) || {}),
      ...edge,
      from: edge.from || edge.from_id,
      to: edge.to || edge.to_id,
      rel: edge.rel || 'related',
      weight: Number(edge.weight) || 0.5,
      inferred: !!edge.inferred,
      createdAt: edge.createdAt || now,
      updatedAt: edge.updatedAt || now
    };
    this.edgesMap.set(edge.id, merged);
    return merged;
  }

  async removeEdge(id) { return this.edgesMap.delete(id); }

  search(opts) {
    if (!this._query) this._query = new KGQuery(this);
    return this._query.search(opts);
  }

  stats() {
    const byType = {};
    for (const n of this.nodesMap.values()) byType[n.type] = (byType[n.type] || 0) + 1;
    return { nodes: this.nodesMap.size, edges: this.edgesMap.size, byType };
  }

  close() { this.nodesMap.clear(); this.edgesMap.clear(); }
}

function clampLimit(n, fallback, max) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(Math.floor(v), max);
}

/**
 * Memory backend if asked, SQLite if a db exists, memory otherwise.
 * Never throws — a missing db costs persistence, not the process.
 */
function openStore({ dbPath, memory, logger } = {}) {
  if (memory) return new MemoryStore();
  if (dbPath) {
    try { return new SQLiteStore({ dbPath, logger }); }
    catch (e) {
      if (logger) logger.warn('kg.sqlite-fallback', { dbPath, message: e.message });
      return new MemoryStore();
    }
  }
  return new MemoryStore();
}

;

export { SQLiteStore, MemoryStore, openStore, quote, substitute };
