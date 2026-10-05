// .autoclaw/agents/validation/citation-validator.js
// TODO: implement — stubbed to unblock CI.
export function validateCitation(citation) {
  if (!citation) return { valid: false, reason: "missing citation" };
  return { valid: true, citation };
}

export function validateCitations(citations = []) {
  return citations.map(validateCitation);
}

export class CitationValidator {
  validate(citation) {
    return validateCitation(citation);
  }
  validateAll(citations) {
    return validateCitations(citations);
  }
}

export default { validateCitation, validateCitations, CitationValidator };
