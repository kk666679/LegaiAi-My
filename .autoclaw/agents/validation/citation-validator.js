const AUTHORITY_ORDER = Object.freeze({
  MLJ: 1,
  AM: 2,
  CLJ: 3,
  FC: 4,
  HLR: 5,
  UKPC: 6,
  UKHL: 7,
});

const ABSOLUTE_KEYWORDS = ['always', 'never', 'must always', 'can never', 'no one can'];

export function parseCitation(raw = '') {
  const text = String(raw || '').trim();
  if (!text) {
    return { valid: false, error: 'Citation is empty', format: null, year: null, volume: null, page: null };
  }

  const match = text.match(/^\[(\d{4})\]\s*(\d+)\s+([A-Za-z.]+)\s+(\d+)$/);
  if (!match) {
    return { valid: false, error: `Citation does not match expected format: [YYYY] N FORMAT NNN`, format: null, year: null, volume: null, page: null };
  }

  const [, year, volume, format, page] = match;
  return {
    valid: true,
    format,
    year: Number(year),
    volume: Number(volume),
    page: Number(page),
    raw: text,
  };
}

export function validateCitations(citations = []) {
  const items = Array.isArray(citations) ? citations : [];
  let valid = 0;
  let invalid = 0;

  for (const item of items) {
    const parsed = parseCitation(item);
    if (parsed.valid) valid += 1;
    else invalid += 1;
  }

  return {
    total: items.length,
    valid,
    invalid,
    allValid: invalid === 0 && items.length > 0,
    results: items.map((item) => ({ value: item, ...parseCitation(item) })),
  };
}

export function validateLegalProposition(text = '', citations = []) {
  const lower = String(text || '').toLowerCase();
  const issues = [];

  if (!citations || citations.length === 0) {
    issues.push({ code: 'NO_CITATION', message: 'Legal proposition is unsupported without at least one source citation.' });
    return { verdict: 'INVALID', confidence: 0.1, issues };
  }

  const hasAbsoluteStatement = ABSOLUTE_KEYWORDS.some((term) => lower.includes(term));
  if (hasAbsoluteStatement && citations.length < 2) {
    issues.push({
      code: 'ABSOLUTE_UNQUALIFIED',
      message: 'Absolute statements require multiple supporting authorities or a clear qualification.',
    });
  }

  if (issues.length === 0) {
    return {
      verdict: 'VALID',
      confidence: Math.min(0.99, 0.65 + citations.length * 0.12),
      issues: [],
    };
  }

  return {
    verdict: 'INVALID',
    confidence: 0.35,
    issues,
  };
}

export function checkConflictingAuthorities(citationsA = [], citationsB = []) {
  const setA = new Set(citationsA.map((item) => parseCitation(item)).filter((item) => item.valid).map((item) => item.year));
  const setB = new Set(citationsB.map((item) => parseCitation(item)).filter((item) => item.valid).map((item) => item.year));
  const overlappingYears = [...setA].filter((year) => setB.has(year));

  return {
    overlappingYears,
    potentialConflict: overlappingYears.length > 0,
    yearsA: [...setA],
    yearsB: [...setB],
  };
}

export function validateCitationFormat(text = '') {
  const matches = String(text || '').matchAll(/\[(\d{4})\]\s*(\d+)\s+([A-Za-z.]+)\s+(\d+)/g);
  const citations = [...matches].map((match) => `[${match[1]}] ${match[2]} ${match[3]} ${match[4]}`);
  const parsed = citations.map((citation) => parseCitation(citation));
  const invalid = parsed.filter((citation) => !citation.valid).length;

  return {
    foundCitations: citations.length,
    validCitations: parsed.filter((citation) => citation.valid).length,
    invalidCitations: invalid,
    allValid: invalid === 0 && citations.length > 0,
    citations: parsed,
  };
}

export function rankCitationAuthority(citations = []) {
  const results = Array.isArray(citations) ? citations : [];

  return results
    .map((citation) => {
      const parsed = parseCitation(citation);
      if (!parsed.valid) {
        return { ...parsed, rank: Number.MAX_SAFE_INTEGER, format: 'INVALID' };
      }
      return {
        ...parsed,
        format: String(parsed.format).toUpperCase(),
        rank: AUTHORITY_ORDER[String(parsed.format).toUpperCase()] ?? 99,
      };
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return b.year - a.year;
    });
}

export const CITATION_VALIDATOR = Object.freeze({
  AUTHORITY_ORDER,
  ABSOLUTE_KEYWORDS,
});
