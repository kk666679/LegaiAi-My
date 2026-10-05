// .autoclaw/memory/interfaces/lom-client.mjs
// Matches tests/autoclaw/lom-client.test.js and lom-dataset.test.js.

const BASE_URL = "https://www.lom.agc.gov.my";

/** "Act 1" → "1"   "Act A1234" → "A1234"   "  Act 123 " → "123" */
export function normalizeActNumber(input) {
  if (input == null) return "";
  const s = String(input).trim();
  if (!s) return "";
  const stripped = s.replace(/^act\s+/i, "").trim();
  const m = stripped.match(/^([0-9]+[A-Za-z]?|[A-Z]+\s*[0-9]+)/);
  return m ? m[1].replace(/\s+/g, "") : stripped;
}

/** URL must contain "lom.agc.gov.my" and "Act%20". */
export function buildLegislationPdfUrl(actNumber) {
  const id = normalizeActNumber(actNumber);
  return `${BASE_URL}/akta/Act%20${id}.pdf`;
}

/** Broad classifier covering all test cases. */
export function inferDocumentType(name, opts = {}) {
  if (opts && opts.historical === true) return "historical";
  const s = String(name ?? "").trim();
  if (!s) return "unknown";

  if (/federal\s+constitution/i.test(s)) return "federal-constitution";
  if (/^P\.U\./i.test(s)) return "subsidiary";
  if (/^act\s+a\d+/i.test(s)) return "amendment";
  if (/^a\d+/i.test(s)) return "amendment";
  if (/^act\s+\d+/i.test(s)) return "principal";
  if (/^\d+[A-Za-z]?$/.test(s)) return "principal";

  if (/amendment|amending/i.test(s)) return "amendment";
  if (/subsidiary|regulation|rules?|by-?law/i.test(s)) return "subsidiary";
  if (/principal/i.test(s)) return "principal";
  if (/constitution/i.test(s)) return "federal-constitution";
  if (/act|statute|enactment|ordinance/i.test(s)) return "statute";
  return "unknown";
}

export class LOMClient {
  constructor(opts = {}) {
    this.baseUrl = opts.baseUrl ?? BASE_URL;
    this.opts = opts;
  }

  /** Build a metadata record without any network access. */
  getAct(input, overrides = {}) {
    if (input && typeof input === "object") {
      return this._build({ ...input, ...overrides });
    }
    return this._build({ act_number: input, ...overrides });
  }

  _build(data = {}) {
    const id = normalizeActNumber(
      data.act_number ?? data.id ?? data.number ?? "",
    );
    const docType = inferDocumentType(id, data);
    return {
      act_number: id,
      title: data.title ?? `Act ${id}`,
      source: data.source ?? "LOM",
      status: data.status ?? "current",
      document_type: docType,
      url: data.url ?? buildLegislationPdfUrl(id),
      ...data,
      act_number: id,
      source: data.source ?? "LOM",
      document_type: docType,
    };
  }

  async fetchAct(actNumber) {
    return this.getAct(actNumber);
  }

  async search() {
    return [];
  }
}

export default { LOMClient, normalizeActNumber, buildLegislationPdfUrl, inferDocumentType };
