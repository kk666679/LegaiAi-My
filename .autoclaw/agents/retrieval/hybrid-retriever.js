const BILINGUAL_EXPANSIONS = Object.freeze({
  akta: ['act', 'statute', 'legislation'],
  syarikat: ['company', 'corporate'],
  pemegang: ['shareholder', 'stockholder'],
  saham: ['shares', 'stock'],
  director: ['director', 'board'],
  breach: ['breach', 'violation'],
  company: ['company', 'corporate'],
  shareholder: ['shareholder', 'member'],
  rights: ['rights', 'entitlement'],
});

function normalizeText(value = '') {
  return String(value || '').toLowerCase();
}

function expandQuery(query = '') {
  const tokens = new Set();
  const text = normalizeText(query);

  for (const [key, values] of Object.entries(BILINGUAL_EXPANSIONS)) {
    if (text.includes(key)) {
      tokens.add(key);
      for (const value of values) tokens.add(value);
    }
  }

  text.split(/[^a-z0-9]+/).filter(Boolean).forEach((token) => tokens.add(token));
  return [...tokens];
}

export function runHybridRetrieval(docs = [], query = '', options = {}) {
  const filters = options.filters || {};
  const topK = Number(options.topK || docs.length || 10);
  const expandedTokens = expandQuery(query);
  const filtered = docs.filter((doc) => {
    if (filters.jurisdiction && doc.jurisdiction && String(doc.jurisdiction).toUpperCase() !== String(filters.jurisdiction).toUpperCase()) {
      return false;
    }
    if (filters.sourceType && doc.sourceType && String(doc.sourceType).toLowerCase() !== String(filters.sourceType).toLowerCase()) {
      return false;
    }
    return true;
  });

  const scored = filtered
    .map((doc) => {
      const title = normalizeText(doc.title || doc.caseName || '');
      const content = normalizeText(`${doc.content || ''} ${doc.caseName || ''} ${doc.title || ''}`);
      const sourceType = String(doc.sourceType || '').toLowerCase();
      let score = Number(doc.authorityScore || 0) * 1.5;

      expandedTokens.forEach((token) => {
        if (title.includes(token) || content.includes(token)) {
          score += 0.35;
        }
      });

      if (sourceType === 'legislation') score += 0.6;
      if (sourceType === 'case') score += 0.2;
      if (title.includes('companies act') || title.includes('akta syarikat')) score += 0.5;
      if (title.includes('companies act 2016') || title.includes('akta syarikat 2016')) score += 0.4;
      if (content.includes('shareholder') || content.includes('pemegang saham')) score += 0.3;
      if (content.includes('director') || content.includes('pengarah')) score += 0.2;

      return {
        id: doc.id,
        title: doc.title || doc.caseName || 'Untitled result',
        relevanceScore: Number(score.toFixed(4)),
        score: Number(score.toFixed(4)),
        metadata: {
          ...doc,
          act_number: doc.act_number || doc.actNumber || null,
        },
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);

  return {
    count: scored.length,
    results: scored,
    query,
    filters,
  };
}
