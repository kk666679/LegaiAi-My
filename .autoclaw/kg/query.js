import { canonicalKey } from './canonical.js';

/**
 * query — the read API over a store.
 *
 * Scoring is deterministic and offline: canonical exact match (2 pts),
 * substring hit (1 pt), 0.15 per overlapping token. A dense/sparse backend
 * can be injected for hybrid retrieval; without one, `hybrid()` falls back to
 * the same deterministic search. Never invents an id — it only ever returns
 * rows that exist.
 */

class KGQuery {
  constructor(store, { dense, sparse } = {}) {
    if (!store) throw new Error('KGQuery requires a store');
    this.store = store;
    this.dense = dense || null;
    this.sparse = sparse || null;
  }

  async node(id) { return this.store.getNode(id); }

  async edgesOf(id, opts = {}) { return this.store.neighbours(id, opts); }

  async search({ q, k = 8, type, tag } = {}) {
    if (!q) throw new Error('search requires { q }');
    const needle = String(q).toLowerCase();
    const needleCanon = canonicalKey({ title: q });
    const tokens = (needle.match(/[a-z0-9]+/g) || []).filter(t => t.length > 2);
    const pool = await this.store.listNodes({ limit: 2000, type, tag });

    const scored = pool.map(n => {
      const hay = `${n.title || ''} ${n.canonical || ''} ${n.body || ''}`.toLowerCase();
      const score =
        (n.canonical === needleCanon ? 2 : 0) +
        (hay.includes(needle) ? 1 : 0) +
        tokens.reduce((a, t) => a + (hay.includes(t) ? 0.15 : 0), 0);
      return { n, score };
    });
    scored.sort((a, b) => b.score - a.score || String(a.n.id).localeCompare(String(b.n.id)));
    return scored.filter(s => s.score > 0).slice(0, k).map(s => ({ ...s.n, score: Number(s.score.toFixed(4)) }));
  }

  /** Breadth-first expansion from `start`, filtered by relation. */
  async traverse({ start, hops = 2, rels = [], limit = 100 } = {}) {
    if (!start) throw new Error('traverse requires { start }');
    const visited = new Set([start]);
    let frontier = [start];
    const edges = [];
    for (let h = 0; h < hops; h++) {
      const next = [];
      for (const node of frontier) {
        const nb = await this.store.neighbours(node, { limit: 50 });
        for (const e of nb || []) {
          if (rels.length && !rels.includes(e.rel)) continue;
          edges.push({ from: node, to: e.id, rel: e.rel, weight: e.weight });
          if (!visited.has(e.id) && visited.size < limit) { visited.add(e.id); next.push(e.id); }
        }
      }
      frontier = next;
      if (!frontier.length) break;
    }
    return { start, hops, nodes: [...visited], edges };
  }

  /**
   * Reciprocal-rank fusion over the dense and sparse backends.
   * One hit list is better than none; zero hit lists falls back to `search`.
   */
  async hybrid({ q, k = 8 } = {}) {
    if (!q) throw new Error('hybrid requires { q }');
    const denseHits = this.dense ? await this.dense.search({ q, k: k * 2 }) : [];
    const sparseHits = this.sparse ? await this.sparse.search({ q, k: k * 2 }) : [];
    if (!denseHits.length && !sparseHits.length) return { hits: await this.search({ q, k }) };

    const scores = new Map();
    const byId = new Map();
    for (const list of [denseHits, sparseHits]) {
      list.forEach((doc, idx) => {
        if (!doc || !doc.id) return;
        scores.set(doc.id, (scores.get(doc.id) || 0) + 1 / (60 + idx + 1));
        byId.set(doc.id, doc);
      });
    }
    const hits = [...scores.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, k)
      .map(([id, score]) => ({ ...(byId.get(id) || {}), id, score: Number(score.toFixed(6)) }));
    return { hits };
  }
}

;

export { KGQuery };
