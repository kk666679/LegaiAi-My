// .autoclaw/agents/validation/citation-validator.js
// ESM. Exports the functions imported by tests/autoclaw/citation-validator.test.js.

/**
 * @typedef {Object} Authority
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [source]
 * @property {string} [url]
 * @property {string} [court]
 * @property {number} [year]
 */

/**
 * @typedef {Object} Citation
 * @property {string} id
 * @property {string} [source]
 * @property {string} [title]
 * @property {string} [url]
 */

/** Validate a single citation. */
export function validateCitation(citation) {
  if (!citation || typeof citation !== "object") {
    return { valid: false, reason: "citation is not an object" };
  }
  if (!citation.id) {
    return { valid: false, reason: "missing id", citation };
  }
  if (citation.url && !/^https?:\/\//i.test(citation.url)) {
    return { valid: false, reason: "invalid url", citation };
  }
  return { valid: true, citation };
}

/** Validate many citations. Returns array of results. */
export function validateCitations(citations = []) {
  return citations.map(validateCitation);
}

/**
 * Detect conflicting authorities — same id resolved from different sources,
 * or same case name with different citations.
 * Returns { conflicts, hasConflict, count }.
 */
export function checkConflictingAuthorities(authorities = []) {
  const conflicts = [];
  for (let i = 0; i < authorities.length; i++) {
    for (let j = i + 1; j < authorities.length; j++) {
      const a = authorities[i];
      const b = authorities[j];
      if (!a || !b) continue;

      const sameId = a.id && b.id && a.id === b.id;
      const diffSource = a.source && b.source && a.source !== b.source;
      const sameNameDiffCourt =
        a.title && b.title && a.title === b.title && a.court && b.court && a.court !== b.court;

      if ((sameId && diffSource) || sameNameDiffCourt) {
        conflicts.push({
          a,
          b,
          reason: sameId ? "same id, different source" : "same case name, different court",
        });
      }
    }
  }
  return {
    conflicts,
    hasConflict: conflicts.length > 0,
    count: conflicts.length,
  };
}

export class CitationValidator {
  constructor(opts = {}) { this.opts = opts; }
  validate(c) { return validateCitation(c); }
  validateAll(cs) { return validateCitations(cs); }
  checkConflicts(a) { return checkConflictingAuthorities(a); }
}

export default {
  validateCitation,
  validateCitations,
  checkConflictingAuthorities,
  CitationValidator,
};
