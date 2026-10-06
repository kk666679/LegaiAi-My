// .autoclaw/memory/interfaces/lom-client.mjs
// Matches tests/autoclaw/lom-client.test.js and lom-dataset.test.js.
// Extended with version-aware legislation record building, content hashing,
// version comparison, and structured provenance — for the AutoClaw legal
// learning domain (§3 Legal Knowledge Model, §4 Provenance, §7 Versioning).

import { createHash } from "node:crypto";

const BASE_URL = "https://www.lom.agc.gov.my";

/** Legal document type taxonomy matching the LOM portal sections. */
export const LEGAL_TYPE = Object.freeze({
  FEDERAL_CONSTITUTION: "federal-constitution",
  PRINCIPAL:            "principal",
  AMENDMENT:            "amendment",
  SUBSIDIARY:           "subsidiary",
  PU_A:                 "pu_a",
  PU_B:                 "pu_b",
  ORDINANCE:            "ordinance",
  HISTORICAL:           "historical",
  UNKNOWN:              "unknown",
});

/** Legal status values with strict current-vs-historical semantics. */
export const LEGAL_STATUS = Object.freeze({
  CURRENT:    "current",
  AMENDED:    "amended",
  REPEALED:   "repealed",
  HISTORICAL: "historical",
  UNKNOWN:    "unknown",
});

/** Trust levels for provenance. */
export const TRUST_LEVEL = Object.freeze({
  AUTHORITATIVE: "authoritative",
  SECONDARY:     "secondary",
  UNCERTAIN:     "uncertain",
});

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

/** Build a stable URL for a LOM Act page (HTML). */
export function buildLegislationPageUrl(actNumber) {
  const id = normalizeActNumber(actNumber);
  return `${BASE_URL}/akta/aktapdf/Act%20${id}.pdf`;
}

/** Content hash for change detection — deterministic over sorted keys. */
export function contentHash(data) {
  if (!data || typeof data !== "object") return "";
  const json = JSON.stringify(data, Object.keys(data).sort());
  return createHash("sha256").update(json).digest("hex").slice(0, 32);
}

/** Build a structured provenance object. Never fabricates source_url. */
export function buildProvenance(sourceUrl, opts = {}) {
  return {
    source: opts.source ?? "LOM",
    source_url: sourceUrl ?? null,
    source_title: opts.source_title ?? "Malaysia Federal Legislation — Attorney General's Chambers",
    retrieved_at: opts.retrieved_at ?? new Date().toISOString(),
    version_date: opts.version_date ?? null,
    trust: opts.trust ?? TRUST_LEVEL.AUTHORITATIVE,
  };
}

/**
 * Compare two version strings (dates or version labels).
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 * "unknown" sorts lowest.
 */
export function compareVersions(a, b) {
  if (!a || a === "unknown") return !b || b === "unknown" ? 0 : -1;
  if (!b || b === "unknown") return 1;
  const da = new Date(a);
  const db = new Date(b);
  if (da.getTime() === db.getTime()) return 0;
  return da.getTime() < db.getTime() ? -1 : 1;
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

  /**
   * Build a version-aware legislation record with full provenance.
   * Unlike _build (which stays backward-compatible), this method always
   * populates provenance, content_hash, jurisdiction, language, and
   * version fields. Dates are never fabricated — null when unknown.
   */
  buildLegislationRecord(data = {}) {
    const id = normalizeActNumber(
      data.act_number ?? data.id ?? data.number ?? "",
    );
    const docType = inferDocumentType(
      data.title ?? id,
      Object.assign({}, data, { historical: data.type === "historical" }),
    );

    const record = {
      act_number: id,
      title: data.title ?? `Act ${id}`,
      type: data.type ?? docType,
      document_type: docType,
      source: data.source ?? "LOM",
      status: data.status ?? LEGAL_STATUS.UNKNOWN,
      jurisdiction: data.jurisdiction ?? "MY",
      language: data.language ?? "unknown",
      version: data.version ?? "unknown",

      // Temporal fields — never fabricated
      royal_assent: data.royal_assent ?? null,
      publication_date: data.publication_date ?? null,
      commencement_date: data.commencement_date ?? null,

      // Relationships
      parent_act: data.parent_act ?? null,
      relationships: data.relationships ?? [],

      // Provenance
      retrieved_at: data.retrieved_at ?? new Date().toISOString(),
      provenance: data.provenance ?? buildProvenance(data.source_url ?? data.url ?? null, {
        source: data.source ?? "LOM",
        retrieved_at: data.retrieved_at,
        version_date: data.version,
        trust: data.trust ?? TRUST_LEVEL.AUTHORITATIVE,
      }),

      // Version history
      content_hash: data.content_hash ?? contentHash(this._hashableFields(data, id, docType)),
      history: data.history ?? [],
    };

    return record;
  }

  /** Extract hashable fields for content hashing (excludes volatile metadata). */
  _hashableFields(data, actNumber, docType) {
    return {
      act_number: actNumber,
      title: data.title ?? `Act ${actNumber}`,
      type: data.type ?? docType,
      status: data.status ?? LEGAL_STATUS.UNKNOWN,
      version: data.version ?? "unknown",
      parent_act: data.parent_act ?? null,
    };
  }

  async fetchAct(actNumber) {
    return this.getAct(actNumber);
  }

  async search() {
    return [];
  }
}

export default {
  LOMClient,
  normalizeActNumber,
  buildLegislationPdfUrl,
  buildLegislationPageUrl,
  contentHash,
  buildProvenance,
  compareVersions,
  inferDocumentType,
  LEGAL_TYPE,
  LEGAL_STATUS,
  TRUST_LEVEL,
};
