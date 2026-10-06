const MODES = Object.freeze({
  light: ['replay', 'prune'],
  deep: ['replay', 'consolidate', 'prune', 'enrich', 'reflect'],
  rem: ['replay', 'reflect'],
  focused: ['replay', 'consolidate', 'prune']
});

class Policy {
  constructor({ dryRun = false, edgeDecay = 0.95, pruneBelow = 0.15, nodeLimit = 5000, edgeLimit = 10000 } = {}) {
    if (!Number.isFinite(edgeDecay) || edgeDecay < 0 || edgeDecay > 1) throw new RangeError('edgeDecay must be between 0 and 1');
    if (!Number.isFinite(pruneBelow) || pruneBelow < 0 || pruneBelow > 1) throw new RangeError('pruneBelow must be between 0 and 1');
    this.dryRun = Boolean(dryRun);
    this.edgeDecay = edgeDecay;
    this.pruneBelow = pruneBelow;
    this.nodeLimit = nodeLimit;
    this.edgeLimit = edgeLimit;
  }
}

function normalizeCanonical(node) {
  return String(node.canonical || node.title || node.id).trim().toLowerCase().replace(/\s+/g, ' ');
}

async function listEdges(store, limit) {
  if (typeof store.listEdges === 'function') return store.listEdges({ limit });
  const edges = store.edges instanceof Map ? store.edges : store._edges;
  if (edges instanceof Map) return [...edges.values()].slice(0, limit);
  throw new TypeError('KG store requires listEdges() or an edges Map');
}

async function replay({ store, policy }) {
  const nodes = await store.listNodes({ limit: policy.nodeLimit });
  const edges = await listEdges(store, policy.edgeLimit);
  let decayed = 0;

  if (!policy.dryRun) {
    for (const edge of edges) {
      const weight = Number(edge.weight);
      if (!Number.isFinite(weight)) continue;
      await store.putEdge({ ...edge, weight: weight * policy.edgeDecay, updatedAt: Date.now() });
      decayed++;
    }
  }

  return { nodes: nodes.length, edges: edges.length, decayed };
}

async function consolidate({ store, policy, state }) {
  const groups = new Map();
  for (const node of state.nodes) {
    const key = normalizeCanonical(node);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(node);
  }

  const remap = new Map();
  const merges = [];
  for (const [canonical, duplicates] of groups) {
    if (duplicates.length < 2) continue;
    duplicates.sort((a, b) =>
      (Number(b.salience) || 0) - (Number(a.salience) || 0) ||
      (Number(b.accessCount) || 0) - (Number(a.accessCount) || 0) ||
      String(a.id).localeCompare(String(b.id))
    );
    const [keep, ...remove] = duplicates;
    const mergedFrom = new Set([...(keep.mergedFrom || [])]);
    const tags = new Set([...(keep.tags || [])]);
    let body = keep.body;
    let salience = Number(keep.salience) || 0;

    for (const node of remove) {
      remap.set(node.id, keep.id);
      mergedFrom.add(node.id);
      for (const id of node.mergedFrom || []) mergedFrom.add(id);
      for (const tag of node.tags || []) tags.add(tag);
      if (!body && node.body) body = node.body;
      salience = Math.max(salience, Number(node.salience) || 0);
      merges.push({ canonical, kept: keep.id, removed: node.id });
    }

    if (!policy.dryRun) {
      await store.upsert({ ...keep, body, salience, tags: [...tags], mergedFrom: [...mergedFrom] });
    }
  }

  if (remap.size && !policy.dryRun) {
    for (const edge of state.edges) {
      const from = remap.get(edge.from) || edge.from;
      const to = remap.get(edge.to) || edge.to;
      if (from === to) {
        await store.removeEdge(edge.id);
      } else if (from !== edge.from || to !== edge.to) {
        await store.putEdge({ ...edge, from, to, updatedAt: Date.now() });
      }
    }
    for (const id of remap.keys()) await store.removeNode(id);
  }

  return { merges, duplicateCount: remap.size };
}

async function prune({ store, policy }) {
  const [nodes, edges] = await Promise.all([
    store.listNodes({ limit: policy.nodeLimit }),
    listEdges(store, policy.edgeLimit)
  ]);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const pruned = edges.filter((edge) =>
    !Number.isFinite(Number(edge.weight)) ||
    Number(edge.weight) < policy.pruneBelow ||
    !nodeIds.has(edge.from) ||
    !nodeIds.has(edge.to)
  ).map((edge) => edge.id);

  if (!policy.dryRun) {
    for (const id of pruned) await store.removeEdge(id);
  }

  return { pruned };
}

async function enrich({ store, policy }) {
  const [nodes, edges] = await Promise.all([
    store.listNodes({ limit: policy.nodeLimit }),
    listEdges(store, policy.edgeLimit)
  ]);
  return { nodes: nodes.length, edges: edges.length, added: [] };
}

async function reflect({ store, state }) {
  const stats = typeof store.stats === 'function'
    ? await store.stats()
    : { nodes: (await store.listNodes()).length, edges: (await listEdges(store, 10000)).length };
  return { initialNodes: state.nodes.length, initialEdges: state.edges.length, final: stats };
}

const PHASES = Object.freeze({ replay, consolidate, prune, enrich, reflect });

class Dreamer {
  constructor({ store, policy = new Policy() } = {}) {
    if (!store || typeof store.listNodes !== 'function' ||
      (typeof store.listEdges !== 'function' && !(store.edges instanceof Map) && !(store._edges instanceof Map))) {
      throw new TypeError('Dreamer requires a KG store with listNodes() and edge access');
    }
    this.store = store;
    this.policy = policy instanceof Policy ? policy : new Policy(policy);
    this.running = false;
    this.cycles = 0;
  }

  isRunning() { return this.running; }
  cycleCount() { return this.cycles; }

  async runCycle({ mode = 'light', reason = 'manual' } = {}) {
    if (this.running) throw new Error('kgdream cycle already running');
    const phaseNames = MODES[mode];
    if (!phaseNames) throw new Error(`Unknown kgdream mode: ${mode}`);

    this.running = true;
    const startedAt = new Date().toISOString();
    const start = Date.now();
    const state = { nodes: [], edges: [] };
    const phases = [];

    try {
      state.nodes = await this.store.listNodes({ limit: this.policy.nodeLimit });
      state.edges = await listEdges(this.store, this.policy.edgeLimit);
      for (const name of phaseNames) {
        const phaseStart = Date.now();
        const result = await PHASES[name]({ store: this.store, policy: this.policy, state, reason });
        phases.push({ name, ms: Date.now() - phaseStart, ...result });
      }
      return {
        cycleId: `kgdream_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        mode,
        reason,
        dryRun: this.policy.dryRun,
        ok: true,
        startedAt,
        finishedAt: new Date().toISOString(),
        ms: Date.now() - start,
        phases
      };
    } finally {
      this.running = false;
      this.cycles++;
    }
  }
}

function createDreamer({ store, policy = {} } = {}) {
  return new Dreamer({ store, policy });
}

export { Dreamer, Policy, PHASES, MODES, createDreamer };
