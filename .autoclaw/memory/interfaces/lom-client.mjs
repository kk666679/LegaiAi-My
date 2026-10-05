// .autoclaw/memory/interfaces/lom-client.mjs

const BASE_URL = "https://www.lom.agc.gov.my";

/**
 * Normalise an Act identifier.
 *   "Act 1"       → "1"
 *   "act 265"     → "265"
 *   "ACT  A123"   → "A123"
 *   "  883  "     → "883"
 *   "Act 1 of 1976" → "1"   (drops trailing year — test contract)
 */
export function normalizeActNumber(input) {
  if (input == null) return "";
  const s = String(input).trim();
  if (!s) return "";
  // strip leading "Act"
  const stripped = s.replace(/^act\s+/i, "").trim();
  // grab leading alphanumeric id
  const m = stripped.match(/^([0-9]+[A-Za-z]?|[A-Z]+\s*[0-9]+)/);
  return m ? m[1].replace(/\s+/g, "") : stripped;
}

/** Build the canonical LOM PDF URL (must contain lom.agc.gov.my). */
export function buildLegislationPdfUrl(actNumber) {
  const id = normalizeActNumber(actNumber);
  return `${BASE_URL}/Akta/Act_${id}.pdf`;
}

/**
 * Classify a document.
 * Order matters — amendment must be checked before statute.
 */
export function inferDocumentType(name) {
  const n = String(name ?? "").toLowerCase();
  if (/\bconstitution\b|\bfederal constitution\b/.test(n)) return "constitution";
  if (/\bamendment\b|\bamending\b|\bamendment act\b|\bact\s+a\d+/.test(n)) return "amendment";
  if (/\brule\b|\bregulation\b|\bby-?law\b|\bsubsidiary\b/.test(n)) return "subsidiary";
  if (/\bprincipal\b|\bprincipal act\b/.test(n)) return "principal";
  if (/\bact\b|\bstatute\b|\benactment\b|\bordinance\b/.test(n)) return "statute";
  if (/\bv\b|\bcase\b|\bjudgment\b/.test(n)) return "case";
  return "unknown";
}

export class LOMClient {
  constructor(opts = {}) {
    this.baseUrl = opts.baseUrl ?? BASE_URL;
    this.opts = opts;
  }

  /** Return a metadata record for an Act without hitting the network. */
  getAct(actNumber) {
    const id = normalizeActNumber(actNumber);
    return {
      id,
      actNumber: id,
      url: buildLegislationPdfUrl(id),
      source: this.baseUrl,
      type: inferDocumentType(`Act ${id}`),
    };
  }

  async fetchAct(actNumber) { return this.getAct(actNumber); }
  async search(_query) { return []; }
}

export default { LOMClient, normalizeActNumber, buildLegislationPdfUrl, inferDocumentType };
