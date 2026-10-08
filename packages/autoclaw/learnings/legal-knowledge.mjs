// .autoclaw/learnings/legal-knowledge.mjs
// Legal Knowledge Model for Malaysian Federal Legislation.
//
// This module implements §3 (Legal Knowledge Model), §4 (Provenance),
// §7 (Versioning), §12 (Learning Rules), §13 (Deduplication & Contradictions)
// of the AutoClaw legal learning task.
//
// It works together with the existing STM/LTM memory system:
//   - encodeForLTM() converts a LegislationRecord into an LTM entry
//   - decodeFromLTM() converts an LTM entry back into a LegislationRecord
//   - detectVersionConflict() / resolveVersionConflict() manage version changes
//   - validateProvenance() enforces the provenance contract
//   - legalScore() ranks legislation relevance against a query

import {
  LEGAL_TYPE,
  LEGAL_STATUS,
  TRUST_LEVEL,
  normalizeActNumber,
  buildProvenance,
  contentHash,
  compareVersions,
} from "../memory/interfaces/lom-client.mjs";

const AGC_SOURCE_URL = "https://lom.agc.gov.my/";

/**
 * Stable LTM ID for a legislation record.
 * One LTM entry per Act number — versions are tracked in metadata.history,
 * not as separate entries, so retrieval always returns the current version.
 */
export function legalEntryId(actNumber, docType) {
  const num = normalizeActNumber(actNumber);
  const kind = docType || "act";
  return `legal:${kind}:${num}`;
}

/**
 * Canonical tag set for an LTM legislation entry.
 * Tags are used by LTM's tag index and retrieval.scored() for filtering.
 */
export function legalTags(record) {
  const tags = new Set();
  tags.add("legal");
  tags.add(`legal:act:${record.act_number}`);
  tags.add(`legal:type:${record.type}`);
  tags.add(`legal:status:${record.status}`);
  tags.add(`legal:jurisdiction:${record.jurisdiction ?? "MY"}`);
  if (record.parent_act) tags.add(`legal:parent:${record.parent_act}`);
  if (record.language) tags.add(`legal:lang:${record.language}`);
  if (record.version && record.version !== "unknown") {
    tags.add(`legal:version:${record.version}`);
  }
  return Array.from(tags);
}

/**
 * Human-readable text for an LTM legislation entry (used by text search).
 */
export function legalText(record) {
  const parts = [
    record.title,
    `(Act ${record.act_number})`,
    `type: ${record.type}`,
    `status: ${record.status}`,
  ];
  if (record.parent_act) parts.push(`(amends Act ${record.parent_act})`);
  return parts.join(" — ");
}

/**
 * Salience for an LTM entry based on provenance trust and verification.
 * Authoritative LOM-sourced records get high salience; unverified get low.
 */
export function legalSalience(record) {
  const trust = record.provenance?.trust ?? TRUST_LEVEL.UNCERTAIN;
  if (trust === TRUST_LEVEL.AUTHORITATIVE) return 0.9;
  if (trust === TRUST_LEVEL.SECONDARY) return 0.6;
  return 0.3;
}

/**
 * Encode a LegislationRecord into an LTM commit payload.
 *
 * The record is stored as a single LTM entry per Act number. The metadata
 * field carries the full structured record (including version history),
 * while tags and text enable efficient retrieval.
 *
 * @param {object} record - A legislation record (from LOMClient.buildLegislationRecord)
 * @returns {object} LTM commit payload: { id, kind, text, tags, salience, source, metadata }
 */
export function encodeForLTM(record) {
  if (!record || !record.act_number) {
    throw new Error("encodeForLTM requires a record with act_number");
  }
  const id = legalEntryId(record.act_number, record.type);
  const provenance = record.provenance ?? buildProvenance(null, { source: "LOM" });
  const hash = record.content_hash ?? contentHash(_hashableFields(record));

  return {
    id,
    kind: "legislation",
    text: legalText(record),
    tags: legalTags(record),
    salience: legalSalience(record),
    source: provenance.source ?? "LOM",
    metadata: {
      legislation: record,
      provenance: provenance,
      content_hash: hash,
      version: record.version ?? "unknown",
      status_at_commit: record.status,
      versions: record.history ? [
        { version: record.version, content_hash: hash, status: record.status, provenance },
        ...record.history,
      ] : [{ version: record.version, content_hash: hash, status: record.status, provenance }],
      current: {
        version: record.version,
        content_hash: hash,
        status: record.status,
        version_date: provenance.version_date ?? null,
      },
    },
  };
}

/**
 * Decode an LTM entry back into a LegislationRecord.
 * Returns null if the entry is not a legislation record.
 */
export function decodeFromLTM(entry) {
  if (!entry || entry.kind !== "legislation") return null;
  if (!entry.metadata?.legislation) return null;
  return entry.metadata.legislation;
}

/**
 * Detect whether a candidate record represents a different version of an
 * already-known legislation. Returns true if:
 *   - The Act number matches
 *   - AND (content_hash differs OR version differs OR status differs)
 *
 * @param {object} existing - Current LTM legislation entry (or decoded record)
 * @param {object} candidate - Incoming legislation record
 */
export function detectVersionConflict(existing, candidate) {
  const existingRecord = decodeFromLTM(existing) || existing;
  const existingHash = existingRecord?.content_hash;
  const candidateHash = candidate?.content_hash;

  if (!existingRecord || !candidate) return false;
  if (existingRecord.act_number !== candidate.act_number) return false;

  if (existingHash && candidateHash && existingHash !== candidateHash) return true;
  if (!existingHash && candidateHash) return true;

  const existingVersion = existingRecord.version ?? "unknown";
  const candidateVersion = candidate.version ?? "unknown";
  if (existingVersion !== candidateVersion && existingVersion !== "unknown" && candidateVersion !== "unknown") {
    return true;
  }

  if (existingRecord.status !== candidate.status) return true;

  return false;
}

/**
 * Resolve a version conflict by preserving the old version in history and
 * adopting the candidate as current. Returns the merged record.
 *
 * @param {object} existing - Current LTM legislation entry (raw LTM entry)
 * @param {object} candidate - Incoming legislation record
 * @returns {object} Merged legislation record with updated history
 */
export function resolveVersionConflict(existing, candidate) {
  const existingRecord = decodeFromLTM(existing) || existing;
  const oldHash = existingRecord.content_hash;
  const newHash = candidate.content_hash ?? contentHash(_hashableFields(candidate));

  const history = Array.isArray(existingRecord.history) ? [...existingRecord.history] : [];

  // Only push to history if the old version is substantially different
  const alreadyRecorded = history.some(
    (h) => h.content_hash === oldHash && h.version === existingRecord.version
  );
  if (!alreadyRecorded && oldHash) {
    history.unshift({
      version: existingRecord.version,
      content_hash: oldHash,
      status: existingRecord.status,
      version_date: existingRecord.provenance?.version_date ?? null,
      provenance: existingRecord.provenance,
    });
  }

  return {
    ...candidate,
    history,
    content_hash: newHash,
  };
}

/**
 * Validate that a legislation record has sufficient provenance to be
 * committed to LTM as authoritative knowledge.
 *
 * Returns { valid: true } or { valid: false, errors: [...] }.
 */
export function validateProvenance(record) {
  const errors = [];

  if (!record) return { valid: false, errors: ["record is null"] };
  if (!record.act_number) errors.push("missing act_number");
  if (!record.title) errors.push("missing title");
  if (!record.provenance) errors.push("missing provenance");
  if (record.provenance) {
    if (!record.provenance.source_url) {
      errors.push("missing provenance.source_url — cannot verify authoritative source");
    }
    if (!record.provenance.retrieved_at) {
      errors.push("missing provenance.retrieved_at");
    }
    if (!record.provenance.source) {
      errors.push("missing provenance.source");
    }
  }

  const sourceUrl = record.provenance?.source_url;
  if (sourceUrl && !sourceUrl.startsWith("https://lom.agc.gov.my/")) {
    errors.push("provenance.source_url is not from the authoritative AGC portal");
  }

  // Never allow fabricated dates to be treated as verified
  const temporalFields = ["royal_assent", "publication_date", "commencement_date"];
  for (const field of temporalFields) {
    if (record[field] !== null && typeof record[field] !== "string") {
      errors.push(`invalid ${field}: must be string or null`);
    }
  }
  if (record.status && record.status !== "unknown" && record.version === "unknown") {
    errors.push("status is set but version is 'unknown' — cannot verify currentness");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Relevance score for a legislation record against a text query.
 * Used by legal retrieval to rank results.
 *
 * @param {object} record - LegislationRecord
 * @param {string} query - Search query
 * @returns {number} Relevance score (higher = more relevant)
 */
export function legalScore(record, query) {
  if (!query) return 0;
  let score = 0;
  let textMatch = false;

  const terms = String(query).toLowerCase().match(/[a-z0-9]+/g) || [];
  const titleMatch = (record.title || "").toLowerCase();
  const actMatch = `act ${record.act_number}`;
  const textBlob = `${titleMatch} ${actMatch}`.toLowerCase();

  for (const t of terms) {
    if (t.length < 2) continue;
    if (titleMatch.includes(t)) { score += 3; textMatch = true; }
    if (textBlob.includes(t)) { score += 1; textMatch = true; }
  }

  // Exact Act number match is highest priority (§8 retrieval priority 1)
  const normalizedQuery = normalizeActNumber(query);
  if (normalizedQuery && record.act_number === normalizedQuery) { score += 20; textMatch = true; }

  // Title contains exact query phrase
  if (titleMatch.includes(String(query).toLowerCase())) { score += 5; textMatch = true; }

  // Status and trust boosts only apply when there is text relevance
  if (!textMatch) {
    return 0;
  }

  if (record.status === LEGAL_STATUS.CURRENT) score += 2;
  if (record.status === LEGAL_STATUS.REPEALED) score -= 5;
  if (record.status === LEGAL_STATUS.HISTORICAL) score -= 3;

  const trust = record.provenance?.trust ?? TRUST_LEVEL.UNCERTAIN;
  if (trust === TRUST_LEVEL.AUTHORITATIVE) score += 3;
  if (trust === TRUST_LEVEL.UNCERTAIN) score -= 2;

  return score;
}

/**
 * Build a LegislationRecord from a seed catalog entry or raw API data.
 * Uses LOMClient.buildLegislationRecord under the hood when a client is
 * provided; otherwise builds directly.
 */
export function buildLegislationRecord(data, opts = {}) {
  const provenance = data.provenance ?? {
    source: data.source ?? "LOM",
    source_url: data.source_url ?? AGC_SOURCE_URL,
    source_title: "Malaysia Federal Legislation — Attorney General's Chambers",
    retrieved_at: data.retrieved_at ?? new Date().toISOString(),
    version_date: data.version_date ?? null,
    trust: data.trust ?? TRUST_LEVEL.AUTHORITATIVE,
  };

  const record = {
    act_number: normalizeActNumber(data.act_number ?? data.id ?? data.number ?? ""),
    title: data.title ?? data.title_en ?? data.title_bm ?? null,
    type: data.type ?? data.document_type ?? "principal",
    document_type: data.document_type ?? data.type ?? "principal",
    source: data.source ?? "LOM",
    status: data.status ?? LEGAL_STATUS.UNKNOWN,
    jurisdiction: data.jurisdiction ?? "MY",
    language: data.language ?? "unknown",
    version: data.version ?? "unknown",

    royal_assent: data.royal_assent ?? null,
    publication_date: data.publication_date ?? null,
    commencement_date: data.commencement_date ?? null,

    parent_act: data.parent_act ?? null,
    relationships: data.relationships ?? [],

    retrieved_at: data.retrieved_at ?? new Date().toISOString(),
    provenance,

    content_hash: data.content_hash ?? contentHash(_hashableFields(data)),
    history: data.history ?? [],
  };

  // For unknown status records, downgrade trust to uncertain unless explicit override
  if (opts.allowUnknown !== true && record.status === LEGAL_STATUS.UNKNOWN) {
    record.provenance = { ...provenance, trust: TRUST_LEVEL.UNCERTAIN };
  }

  return record;
}

function _hashableFields(data) {
  return {
    act_number: normalizeActNumber(data.act_number ?? data.id ?? data.number ?? ""),
    title: data.title ?? data.title_en ?? data.title_bm ?? null,
    type: data.type ?? data.document_type ?? "principal",
    status: data.status ?? "unknown",
    version: data.version ?? "unknown",
    parent_act: data.parent_act ?? null,
  };
}

export {
  LEGAL_TYPE,
  LEGAL_STATUS,
  TRUST_LEVEL,
  AGC_SOURCE_URL,
};

export default {
  legalEntryId,
  legalTags,
  legalText,
  legalSalience,
  encodeForLTM,
  decodeFromLTM,
  detectVersionConflict,
  resolveVersionConflict,
  validateProvenance,
  legalScore,
  buildLegislationRecord,
  LEGAL_TYPE,
  LEGAL_STATUS,
  TRUST_LEVEL,
};
