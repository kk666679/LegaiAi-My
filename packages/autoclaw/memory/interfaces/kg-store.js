export class KnowledgeGraphStore {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  async addRelationship(kind, source, relation, target, metadata = {}) {
    const key = `${kind}:${source}:${relation}:${target}`;
    if (!this.nodes.has(source)) this.nodes.set(source, { kind, id: source });
    if (!this.nodes.has(target)) this.nodes.set(target, { kind, id: target });
    if (!this.edges.some((edge) => edge.key === key)) {
      this.edges.push({ key, kind, source, relation, target, metadata });
    }
    return { key, source, relation, target, metadata };
  }
}
