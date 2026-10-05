// .autoclaw/memory/interfaces/lom-client.js
// Converted from CommonJS to ESM.

export class LOMClient {
  constructor(opts = {}) {
    this.baseUrl = opts.baseUrl ?? "https://lom.gov.my";
    this.opts = opts;
  }
  async fetchAct(_actNumber) {
    return { actNumber: _actNumber, source: this.baseUrl };
  }
}

export function normalizeActNumber(input) {
  if (!input) return "";
  return String(input).trim().replace(/\s+/g, " ").toUpperCase();
}

export function buildLegislationPdfUrl(actNumber) {
  const id = normalizeActNumber(actNumber).replace(/\s+/g, "-").toLowerCase();
  return `https://lom.gov.my/act/${id}.pdf`;
}

export function inferDocumentType(name) {
  const n = String(name).toLowerCase();
  if (n.includes("act")) return "statute";
  if (n.includes("case") || n.includes(" v ")) return "case";
  if (n.includes("rule")) return "rule";
  return "unknown";
}

export default {
  LOMClient,
  normalizeActNumber,
  buildLegislationPdfUrl,
  inferDocumentType,
};
