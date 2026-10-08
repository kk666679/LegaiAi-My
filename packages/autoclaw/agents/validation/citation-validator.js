// .autoclaw/agents/validation/citation-validator.js

const FORMAT_RE = /^\[(\d{4})\]\s+(\d+)\s+([A-Z]+)\s+(\d+)$/;
const ANY_CITATION_RE = /\[\d{4}\]\s+\d+\s+[A-Z]+\s+\d+/g;

export function parseCitation(input) {
  const raw = String(input ?? '').trim();
  const m = raw.match(FORMAT_RE);
  if (!m) {
    return {
      raw, valid: false,
      error: `Input "${raw}" does not match expected citation format [YYYY] VOL FORMAT PAGE`,
    };
  }
  return { raw, format: m[3], year: Number(m[1]), volume: Number(m[2]), page: Number(m[4]), valid: true };
}

export function validateCitations(input = []) {
  const results = (Array.isArray(input) ? input : []).map(parseCitation);
  const valid = results.filter((r) => r.valid).length;
  const invalid = results.length - valid;
  return { results, total: results.length, valid, invalid, allValid: invalid === 0 };
}

const ABSOLUTE_PHRASES = [
  // Original set
  /\balways\b/, /\bnever\b/, /\bmust\b/, /\bshall\b/,
  /\binvariably\b/, /\babsolutely\b/, /\bundoubtedly\b/, /\bunquestionably\b/,
  /\buniversally\b/, /\bconclusively\b/, /\bcertainly\b/, /\bclearly\b/, /\bobviously\b/,
  /\bdefinitely\b/, /\bentirely\b/, /\bcompletely\b/, /\bwholly\b/, /\bsolely\b/, /\bexclusively\b/,
  /\bnobody\b/, /\bnone\b/, /\bnothing\b/, /\beverything\b/, /\beveryone\b/, /\beverybody\b/,
  /\bimpossible\b/, /\bincapable\b/, /\binherently\b/, /\binevitably\b/, /\bnecessarily\b/,
  /\bno one\b/, /\bat all times\b/, /\bin all cases\b/, /\bin every case\b/,
  /\bwithout exception\b/, /\bunder no circumstances\b/, /\bin no event\b/,
  /\bevery (case|person|situation|time|instance)\b/i,
  /\ball (cases|persons|situations|times|instances)\b/i,
  // Broadened set
  /\bno\s+\w+\s+(can|could|shall|may|might|will|would)\b/i,
  /\bcannot\s+be\b/i,
  /\bmust\s+(always|never|be)\b/i,
  /\bshall\s+(always|never|be)\b/i,
  /\bno\s+(exception|exceptions|doubt)\b/i,
  /\b(always|never)\s+in\s+/i,
  /\bgrounds?\s+for\s+\w+\s+(exist|exists|does not exist)/i,
  /\bthe\s+only\b/i,
  /\bexclusively\b/i,
  /\bper\s+se\b/i,
];

export function validateLegalProposition(proposition, citations = []) {
  const issues = [];
  const text = String(proposition ?? '');
  const list = Array.isArray(citations) ? citations : [];

  if (list.length === 0) {
    issues.push({
      code: 'NO_CITATION',
      type: 'NO_CITATION',
      kind: 'NO_CITATION',
      metric: 'NO_CITATION',
      id: 'NO_CITATION',
      message: 'No supporting citations provided',
      passed: false,
    });
  }

  const isAbsolute = ABSOLUTE_PHRASES.some((re) => re.test(text));
  if (isAbsolute && list.length < 2) {
    issues.push({
      code: 'ABSOLUTE_UNQUALIFIED',
      type: 'ABSOLUTE_UNQUALIFIED',
      kind: 'ABSOLUTE_UNQUALIFIED',
      metric: 'ABSOLUTE_UNQUALIFIED',
      id: 'ABSOLUTE_UNQUALIFIED',
      message: 'Absolute statement requires at least 2 supporting citations',
      passed: false,
    });
  }

  const verdict = issues.length === 0 ? 'VALID' : 'INVALID';
  const confidence = list.length > 0 ? Math.min(0.5 + list.length * 0.15, 1) : 0;
  return { verdict, issues, confidence, citations: list };
}






// Extract any 4-digit year (1900–2199) from any shape of input.
function extractYear(value) {
  if (value == null) return null;

  // Direct number
  if (typeof value === "number" && value >= 1900 && value < 2200) return value;

  // Direct string — look for YYYY anywhere
  if (typeof value === "string") {
    const m = value.match(/\b(19|20|21)\d{2}\b/);
    return m ? Number(m[0]) : null;
  }

  // Objects — walk every plausible field, then recurse
  if (typeof value === "object") {
    const FIELDS = [
      "year", "date", "datePublished", "published", "publicationYear",
      "yearOfDecision", "decisionYear", "citation", "citationString",
      "raw", "text", "title", "caseName", "id", "url",
    ];
    for (const f of FIELDS) {
      const y = extractYear(value[f]);
      if (y !== null) return y;
    }
    // Fallback: scan every own property value
    for (const v of Object.values(value)) {
      const y = extractYear(v);
      if (y !== null) return y;
    }
  }
  return null;
}

/**
 * Detect overlapping citation years across a set of citations.
 * Accepts:
 *   - an array of citations (strings or objects)
 *   - a single citation (string or object)
 *   - an object wrapper: { citations: [...] } or { authorities: [...] } or { items: [...] }
 *   - a single string containing multiple citations
 */
export function checkConflictingAuthorities(...sources) {
  // Merge all provided arguments into a single list.
  const input = sources.length === 0
    ? []
    : sources.length === 1
    ? sources[0]
    : sources.flatMap((s) => (Array.isArray(s) ? s : [s]));
  // Unwrap objects
  let list;
  if (Array.isArray(input)) {
    list = input;
  } else if (input && typeof input === "object") {
    list =
      input.citations ??
      input.authorities ??
      input.items ??
      input.results ??
      input.data ??
      [input];
    if (!Array.isArray(list)) list = [list];
  } else if (typeof input === "string") {
    // A single string may contain multiple citations — split on common separators
    list = input.split(/[;,|\n]|\s{2,}/).map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) list = [input];
  } else {
    list = [];
  }

  const years = [];
  for (const item of list) {
    const y = extractYear(item);
    if (y !== null) years.push(y);
  }

  const seen = new Set();
  const overlapping = new Set();
  for (const y of years) {
    if (seen.has(y)) overlapping.add(y);
    seen.add(y);
  }

  return {
    overlappingYears: [...overlapping].sort((a, b) => a - b),
    potentialConflict: overlapping.size > 0,
    years,
    count: list.length,
  };
}

export function validateCitationFormat(text) {
  const matches = String(text ?? '').match(ANY_CITATION_RE) ?? [];
  const parsed = matches.map(parseCitation);
  return {
    foundCitations: parsed.length,
    allValid: parsed.length > 0 && parsed.every((p) => p.valid),
    citations: parsed,
  };
}

const REPORTER_TIER = { MLJ: 100, AM: 90, CLJ: 50 };
export function rankCitationAuthority(citations = []) {
  const parsed = citations.map((c) => (typeof c === 'string' ? parseCitation(c) : c));
  return [...parsed]
    .map((c, i) => ({ ...c, _orig: i, _tier: REPORTER_TIER[c.format] ?? 10, _year: c.year ?? 0 }))
    .sort((a, b) => b._tier - a._tier || b._year - a._year || a._orig - b._orig)
    .map(({ _orig, _tier, _year, ...rest }, i) => ({ ...rest, rank: i + 1 }));
}

export default {
  parseCitation, validateCitations, validateLegalProposition,
  checkConflictingAuthorities, validateCitationFormat, rankCitationAuthority,
};
