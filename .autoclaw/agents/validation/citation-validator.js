// .autoclaw/agents/validation/citation-validator.js

export const VALID_FORMATS = ["statute", "case", "regulation", "secondary"];

/**
 * Parse a raw citation string into { year, volume, reporter, page, title, court, source }.
 * Handles common Malaysian forms: "Act 265", "[1995] 1 MLJ 123", "Section 14 EA 1955".
 */
export function parseCitation(input) {
  if (input == null) return { raw: "", valid: false, reason: "null input" };
  const raw = String(input).trim();
  if (!raw) return { raw, valid: false, reason: "empty" };

  // Act N — statutory form
  const actMatch = raw.match(/^act\s+([0-9]+[A-Za-z]?)/i);
  if (actMatch) {
    return { raw, kind: "statute", actNumber: actMatch[1].toUpperCase(), valid: true };
  }

  // [YYYY] VOL REPORTER PAGE — case form
  const caseMatch = raw.match(/^\[\s*(\d{4})\s*\]\s*(\d+)?\s*([A-Z]+)\s+(\d+)/);
  if (caseMatch) {
    return {
      raw,
      kind: "case",
      year: Number(caseMatch[1]),
      volume: caseMatch[2] ? Number(caseMatch[2]) : undefined,
      reporter: caseMatch[3],
      page: Number(caseMatch[4]),
      valid: true,
    };
  }

  // Section N <ActName YYYY>
  const sectionMatch = raw.match(/^section\s+([0-9A-Za-z]+)\s+(.*?)(?:\s+(\d{4}))?$/i);
  if (sectionMatch) {
    return {
      raw,
      kind: "statute",
      section: sectionMatch[1],
      title: sectionMatch[2]?.trim(),
      year: sectionMatch[3] ? Number(sectionMatch[3]) : undefined,
      valid: true,
    };
  }

  return { raw, valid: false, reason: "unrecognised format" };
}

/** Validate that a string looks like a well-formed citation. */
export function validateCitationFormat(input) {
  const parsed = parseCitation(input);
  return { valid: parsed.valid, reason: parsed.reason, parsed };
}

/** Validate a legal proposition against authorities. */
export function validateLegalProposition(proposition, authorities = []) {
  if (!proposition || typeof proposition !== "string") {
    return { valid: false, reason: "proposition must be a non-empty string", supporting: [] };
  }
  const words = proposition.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const supporting = authorities.filter((a) => {
    const hay = `${a?.title ?? ""} ${a?.text ?? ""} ${a?.summary ?? ""}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  });
  return {
    valid: supporting.length > 0,
    reason: supporting.length ? "matched authorities" : "no authority supports proposition",
    supporting,
  };
}

/** Rank authorities by a simple authority score (higher = stronger). */
export function rankCitationAuthority(authorities = []) {
  const WEIGHT = {
    constitution: 100,
    statute: 80,
    regulation: 60,
    case: 50,
    secondary: 20,
  };
  return [...authorities]
    .map((a) => ({
      authority: a,
      score:
        (WEIGHT[a?.kind] ?? 10) +
        (a?.year ? Math.max(0, 20 - (2026 - a.year)) : 0) +
        (a?.court === "Federal Court" ? 30 : a?.court === "Court of Appeal" ? 20 : 0),
    }))
    .sort((x, y) => y.score - x.score);
}

export function validateCitation(citation) {
  const parsed = parseCitation(typeof citation === "string" ? citation : citation?.raw);
  return { valid: parsed.valid, parsed, reason: parsed.reason };
}

export function validateCitations(citations = []) {
  return citations.map(validateCitation);
}

export function checkConflictingAuthorities(authorities = []) {
  const conflicts = [];
  for (let i = 0; i < authorities.length; i++) {
    for (let j = i + 1; j < authorities.length; j++) {
      const a = authorities[i], b = authorities[j];
      if (!a || !b) continue;
      const sameId = a.id && b.id && a.id === b.id;
      const diffSource = a.source && b.source && a.source !== b.source;
      if (sameId && diffSource) conflicts.push({ a, b, reason: "same id, different source" });
    }
  }
  return { conflicts, hasConflict: conflicts.length > 0, count: conflicts.length };
}

export class CitationValidator {
  constructor(opts = {}) { this.opts = opts; }
  parse(c) { return parseCitation(c); }
  validateFormat(c) { return validateCitationFormat(c); }
  validateProposition(p, a) { return validateLegalProposition(p, a); }
  rank(a) { return rankCitationAuthority(a); }
}

export default {
  parseCitation, validateCitationFormat, validateLegalProposition, rankCitationAuthority,
  validateCitation, validateCitations, checkConflictingAuthorities, CitationValidator,
};
