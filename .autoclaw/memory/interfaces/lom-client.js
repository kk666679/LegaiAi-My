// .autoclaw/memory/interfaces/lom-client.js
// ESM. Exports required by tests/autoclaw/lom-client.test.js and lom-dataset.test.js.

export class LOMClient {
  constructor(opts = {}) {
    this.baseUrl = opts.baseUrl ?? "https://www.lom.gov.my";
    this.opts = opts;
  }

  async fetchAct(actNumber) {
    return {
      actNumber: normalizeActNumber(actNumber),
      source: this.baseUrl,
      url: buildLegislationPdfUrl(actNumber),
    };
  }

  async search(_query) {
    return [];
  }
}

/** Normalise e.g. "act 265" or "  Act  265  " → "Act 265". */
export function normalizeActNumber(input) {
  if (input == null) return "";
  return String(input).trim().replace(/\s+/g, " ").replace(/\bact\b/gi, "Act");
}

/** Build the canonical LOM PDF URL for an Act. */
export function buildLegislationPdfUrl(actNumber) {
  const id = normalizeActNumber(actNumber).replace(/\s+/g, "-").toLowerCase();
  return `https://www.lom.gov.my/act/${id}.pdf`;
}

/** Heuristic document-type classifier. */
export function inferDocumentType(name) {
  const n = String(name ?? "").toLowerCase();
  if (/\bact\b|\bstatute\b|\benactment\b|\bordinance\b/.test(n)) return "statute";
  if (/\bv\b|\bcase\b|\bjudgment\b|\bdecision\b/.test(n)) return "case";
  if (/\brule\b|\bregulation\b|\bby-?law\b/.test(n)) return "regulation";
  if (/\bcircular\b|\bguideline\b/.test(n)) return "circular";
  return "unknown";
}

export default {
  LOMClient,
  normalizeActNumber,
  buildLegislationPdfUrl,
  inferDocumentType,
};
