export class CausalGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.reverse = new Map();
  }

  addNode({ id, type, signal, timestamp, attributes = {} }) {
    this.nodes.set(id, { id, type, signal, timestamp, attributes });
    if (!this.edges.has(id)) this.edges.set(id, []);
    if (!this.reverse.has(id)) this.reverse.set(id, []);
    return id;
  }

  addEdge(from, to, { weight = 1.0, reason } = {}) {
    if (!this.edges.has(from)) this.edges.set(from, []);
    this.edges.get(from).push({ to, weight, reason });
    if (!this.reverse.has(to)) this.reverse.set(to, []);
    this.reverse.get(to).push({ from, weight, reason });
  }

  findRoots() {
    const roots = [];
    for (const [id] of this.nodes) {
      if ((this.reverse.get(id) ?? []).length === 0) {
        roots.push(id);
      }
    }
    return roots;
  }

  traceBack(effectId, { maxDepth = 10, minWeight = 0.3 } = {}) {
    const visited = new Set();
    const paths = [];

    const walk = (id, path, depth) => {
      if (depth > maxDepth || visited.has(id)) return;
      visited.add(id);
      const incoming = this.reverse.get(id) ?? [];
      if (incoming.length === 0) {
        paths.push({ root: id, path: [...path, id] });
        return;
      }
      for (const { from, weight } of incoming) {
        if (weight < minWeight) continue;
        walk(from, [...path, id], depth + 1);
      }
    };

    walk(effectId, [], 0);
    return paths;
  }

  topoSort() {
    const inDegree = new Map();
    for (const [id] of this.nodes) inDegree.set(id, 0);
    for (const [, edges] of this.edges) {
      for (const { to } of edges) {
        inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
      }
    }
    const queue = [...inDegree].filter(([, deg]) => deg === 0).map(([id]) => id);
    const sorted = [];
    while (queue.length) {
      const id = queue.shift();
      sorted.push(id);
      for (const { to } of this.edges.get(id) ?? []) {
        const newDeg = (inDegree.get(to) ?? 0) - 1;
        inDegree.set(to, newDeg);
        if (newDeg === 0) queue.push(to);
      }
    }
    return sorted;
  }

  toDOT() {
    const lines = ['digraph causal {'];
    for (const [id, node] of this.nodes) {
      lines.push(`  "${id}" [label="${node.type}: ${node.signal}"];`);
    }
    for (const [from, edges] of this.edges) {
      for (const { to, weight, reason } of edges) {
        lines.push(`  "${from}" -> "${to}" [label="${reason ?? ''} (${weight})"];`);
      }
    }
    lines.push('}');
    return lines.join('\n');
  }
}
