import type { KgNode, KgEdge } from './node.js';
export class KnowledgeGraph {
  private nodes = new Map<string, KgNode>();
  private edges = new Map<string, KgEdge>();
  private outgoing = new Map<string, Set<string>>();
  private incoming = new Map<string, Set<string>>();
  addNode(input: Omit<KgNode, 'createdAt'> & { createdAt?: string }): KgNode {
    const node: KgNode = { ...input, createdAt: input.createdAt ?? new Date().toISOString() };
    this.nodes.set(node.id, node);
    return node;
  }
  getNode(id: string): KgNode | undefined { return this.nodes.get(id); }
  removeNode(id: string): boolean {
    if (!this.nodes.delete(id)) return false;
    for (const eid of this.outgoing.get(id) ?? []) this.edges.delete(eid);
    for (const eid of this.incoming.get(id) ?? []) this.edges.delete(eid);
    this.outgoing.delete(id); this.incoming.delete(id);
    return true;
  }
  addEdge(input: Omit<KgEdge, 'id' | 'createdAt' | 'weight'> & { id?: string; weight?: number; createdAt?: string }): KgEdge {
    const edge: KgEdge = {
      id: input.id ?? `e_${Math.random().toString(36).slice(2, 10)}`,
      from: input.from, to: input.to, relation: input.relation,
      weight: input.weight ?? 1, data: input.data,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    this.edges.set(edge.id, edge);
    if (!this.outgoing.has(edge.from)) this.outgoing.set(edge.from, new Set());
    if (!this.incoming.has(edge.to)) this.incoming.set(edge.to, new Set());
    this.outgoing.get(edge.from)!.add(edge.id);
    this.incoming.get(edge.to)!.add(edge.id);
    return edge;
  }
  neighbors(id: string, relation?: string): { node: KgNode; edge: KgEdge }[] {
    const result: { node: KgNode; edge: KgEdge }[] = [];
    for (const eid of this.outgoing.get(id) ?? []) {
      const edge = this.edges.get(eid)!;
      if (relation && edge.relation !== relation) continue;
      const node = this.nodes.get(edge.to);
      if (node) result.push({ node, edge });
    }
    return result;
  }
  incomingFrom(id: string, relation?: string): { node: KgNode; edge: KgEdge }[] {
    const result: { node: KgNode; edge: KgEdge }[] = [];
    for (const eid of this.incoming.get(id) ?? []) {
      const edge = this.edges.get(eid)!;
      if (relation && edge.relation !== relation) continue;
      const node = this.nodes.get(edge.from);
      if (node) result.push({ node, edge });
    }
    return result;
  }
  query(predicate: (n: KgNode) => boolean): KgNode[] {
    return Array.from(this.nodes.values()).filter(predicate);
  }
  traverse(startId: string, maxDepth = 3, relation?: string): KgNode[] {
    const visited = new Set<string>([startId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
    const result: KgNode[] = [];
    while (queue.length) {
      const { id, depth } = queue.shift()!;
      if (depth >= maxDepth) continue;
      for (const { node } of this.neighbors(id, relation)) {
        if (visited.has(node.id)) continue;
        visited.add(node.id);
        result.push(node);
        queue.push({ id: node.id, depth: depth + 1 });
      }
    }
    return result;
  }
  stats(): { nodes: number; edges: number } { return { nodes: this.nodes.size, edges: this.edges.size }; }
  clear(): void { this.nodes.clear(); this.edges.clear(); this.outgoing.clear(); this.incoming.clear(); }
}
