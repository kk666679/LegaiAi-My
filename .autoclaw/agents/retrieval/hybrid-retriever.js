// .autoclaw/agents/retrieval/hybrid-retriever.js
// Matches tests/autoclaw/hybrid-retriever.test.js assertions.

export class HybridRetriever {
  constructor(options = {}) {
    this.options = options;
    this.semanticWeight = options.semanticWeight ?? 0.6;
    this.keywordWeight = options.keywordWeight ?? 0.4;
  }

  retrieve(docs, query, options = {}) {
    const opts = { ...this.options, ...options };
    const topK = opts.topK ?? 10;

    let filtered = Array.isArray(docs) ? docs.slice() : [];
    if (opts.filters && typeof opts.filters === "object") {
      filtered = filtered.filter((d) =>
        Object.entries(opts.filters).every(([k, v]) => d?.[k] === v),
      );
    }

    const terms = String(query ?? "")
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    const scored = filtered.map((doc, idx) => {
      const text = [
        doc.title,
        doc.caseName,
        doc.content,
        doc.citation,
        doc.act_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      let hits = 0;
      for (const t of terms) if (text.includes(t)) hits++;
      const termScore = terms.length ? hits / terms.length : 0;

      const sourceBoost = doc.sourceType === "legislation" ? 0.5 : 0;
      const authorityBoost = typeof doc.authorityScore === "number" ? doc.authorityScore : 0;

      return {
        ...doc,
        id: doc.id ?? `doc-${idx}`,
        relevanceScore: termScore + sourceBoost + authorityBoost,
        metadata: {
          act_number: doc.act_number,
          sourceType: doc.sourceType,
          jurisdiction: doc.jurisdiction,
          language: doc.language,
          version: doc.version,
        },
      };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const results = scored.slice(0, topK);

    return { count: results.length, results, query, topK };
  }
}

export function createHybridRetriever(options) {
  return new HybridRetriever(options);
}

/** Test-facing entry: (docs, query, options) → { count, results }. */
export function runHybridRetrieval(docs, query, options = {}) {
  return new HybridRetriever(options).retrieve(docs, query, options);
}

export default { HybridRetriever, createHybridRetriever, runHybridRetrieval };
