// .autoclaw/agents/retrieval/hybrid-retriever.js
// ESM. Exports required by tests/autoclaw/hybrid-retriever.test.js.

/**
 * @typedef {Object} RetrievalResult
 * @property {string} id
 * @property {string} [text]
 * @property {number} [score]
 * @property {string} [source]
 */

export class HybridRetriever {
  constructor(options = {}) {
    this.options = options;
    this.semanticWeight = options.semanticWeight ?? 0.5;
    this.keywordWeight = options.keywordWeight ?? 0.5;
  }

  /** Main retrieval entry point. Async — returns {query, results, strategy}. */
  async retrieve(query, options = {}) {
    const semantic = await this.semanticSearch(query, options);
    const keyword = await this.keywordSearch(query, options);
    const fused = this.fuse(semantic, keyword);
    return {
      query,
      results: fused,
      strategy: "hybrid",
      semantic: semantic.length,
      keyword: keyword.length,
    };
  }

  async semanticSearch(_query, _options = {}) {
    return [];
  }

  async keywordSearch(_query, _options = {}) {
    return [];
  }

  /** Reciprocal-rank fusion of two result lists. */
  fuse(semantic = [], keyword = []) {
    const scores = new Map();
    const add = (list, weight) => {
      list.forEach((item, idx) => {
        const key = item?.id ?? String(idx);
        const prev = scores.get(key) ?? { item, score: 0 };
        prev.score += weight * (1 / (idx + 1));
        scores.set(key, prev);
      });
    };
    add(semantic, this.semanticWeight);
    add(keyword, this.keywordWeight);
    return [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .map(({ item, score }) => ({ ...item, score }));
  }
}

export function createHybridRetriever(options) {
  return new HybridRetriever(options);
}

/** Test-facing entry point. */
export async function runHybridRetrieval(query, options = {}) {
  const retriever = new HybridRetriever(options);
  return retriever.retrieve(query, options);
}

export default {
  HybridRetriever,
  createHybridRetriever,
  runHybridRetrieval,
};
