// .autoclaw/agents/retrieval/hybrid-retriever.js

export class HybridRetriever {
  constructor(options = {}) {
    this.options = options;
    this.semanticWeight = options.semanticWeight ?? 0.6;
    this.keywordWeight = options.keywordWeight ?? 0.4;
  }

  /** Accepts either (query) or ({ query, ... }) or (query, opts) */
  async retrieve(query, options = {}) {
    const q = typeof query === "string" ? query : query?.query ?? "";
    const opts = typeof query === "object" && query !== null ? { ...query, ...options } : options;

    const corpus = opts.corpus ?? opts.documents ?? opts.sources ?? [];
    const semantic = await this.semanticSearch(q, { ...opts, corpus });
    const keyword = await this.keywordSearch(q, { ...opts, corpus });
    let results = this.fuse(semantic, keyword);

    if (opts.sourceFilter) {
      results = results.filter((r) => r.source === opts.sourceFilter);
    }
    if (typeof opts.limit === "number") {
      results = results.slice(0, opts.limit);
    }

    return { query: q, results, count: results.length, strategy: "hybrid" };
  }

  async semanticSearch(query, opts = {}) {
    const corpus = opts.corpus ?? [];
    return this.score(query, corpus, 0.5);
  }

  async keywordSearch(query, opts = {}) {
    const corpus = opts.corpus ?? [];
    return this.score(query, corpus, 0.3);
  }

  score(query, corpus, baseScore) {
    const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
    return corpus
      .map((doc, idx) => {
        const text = String(doc.text ?? doc.title ?? doc.content ?? "").toLowerCase();
        const hits = terms.filter((t) => text.includes(t)).length;
        return {
          ...doc,
          id: doc.id ?? `doc-${idx}`,
          score: hits ? baseScore + hits / terms.length : 0,
        };
      })
      .filter((d) => d.score > 0);
  }

  fuse(semantic, keyword) {
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

export function createHybridRetriever(options) { return new HybridRetriever(options); }

export async function runHybridRetrieval(query, options = {}) {
  return new HybridRetriever(options).retrieve(query, options);
}

export default { HybridRetriever, createHybridRetriever, runHybridRetrieval };
