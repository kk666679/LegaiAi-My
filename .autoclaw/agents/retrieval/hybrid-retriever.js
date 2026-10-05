// .autoclaw/agents/retrieval/hybrid-retriever.js
// TODO: implement — stubbed to unblock CI.
export class HybridRetriever {
  constructor(opts = {}) {
    this.opts = opts;
  }
  async retrieve(_query, _options = {}) {
    return { results: [], metadata: { strategy: "hybrid", stubbed: true } };
  }
  async semanticSearch(_query) {
    return [];
  }
  async keywordSearch(_query) {
    return [];
  }
  fuse(semantic = [], keyword = []) {
    return [...semantic, ...keyword];
  }
}

export function createHybridRetriever(opts) {
  return new HybridRetriever(opts);
}

export default { HybridRetriever, createHybridRetriever };
