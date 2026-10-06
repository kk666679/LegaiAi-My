// .autoclaw/learnings/legal-promotion.mjs
// Legal-specific STM→LTM promotion with provenance validation.
//
// Implements §5 (STM for legal research), §6 (LTM for durable knowledge),
// §12 (learning rules), and §13 (deduplication & contradictions).
//
// During a legal research session, the agent builds STM context:
//   question → legislation → provisions → definitions → amendments → reasoning
// Verified legislation (with authoritative provenance) may be promoted to LTM.
// Unverified or uncertain information stays in STM only.

import { KIND, TIER } from "../memory/constants.js";
import {
  encodeForLTM,
  decodeFromLTM,
  detectVersionConflict,
  resolveVersionConflict,
  validateProvenance,
  buildLegislationRecord,
} from "./legal-knowledge.mjs";

/** STM entry types for legal research context. */
export const LEGAL_STM_TYPE = Object.freeze({
  QUESTION:       "legal:question",
  LEGISLATION:    "legal:legislation",
  PROVISION:      "legal:provision",
  DEFINITION:     "legal:definition",
  AMENDMENT:      "legal:amendment",
  SUBSIDIARY:     "legal:subsidiary",
  FINDING:        "legal:finding",
  VERIFICATION:   "legal:verification",
  RELATIONSHIP:   "legal:relationship",
  REASONING:      "legal:reasoning",
  CITATION:       "legal:citation",
  UNCERTAINTY:    "legal:uncertainty",
});

/**
 * Initialize a legal research session in STM.
 * Creates a session entry recording the user's question.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - unique research session ID
 * @param {string} question - the user's legal question
 * @returns {object} The STM session entry
 */
export function legalResearchContext(mem, sessionId, question) {
  return mem.remember(sessionId, {
    text: question,
    query: question,
    tags: ["legal", "legal:research", LEGAL_STM_TYPE.QUESTION],
    source: TIER.STM,
    metadata: {
      question,
      startedAt: new Date().toISOString(),
      researchSession: true,
    },
  });
}

/**
 * Record a piece of legislation discovered during research in STM.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - research session ID
 * @param {object} legislation - legislation record
 * @param {object} [opts] - { verified, confidence, source }
 */
export function addLegislation(mem, sessionId, legislation, opts = {}) {
  const text = legislation.title
    ? `${legislation.title} (Act ${legislation.act_number})`
    : `Act ${legislation.act_number}`;

  return mem.remember(sessionId, {
    text,
    tags: [
      "legal",
      LEGAL_STM_TYPE.LEGISLATION,
      `legal:act:${legislation.act_number}`,
      `legal:type:${legislation.type}`,
      `legal:status:${legislation.status}`,
    ],
    source: {
      tier: TIER.STM,
      type: "legislation",
      verified: opts.verified ?? false,
      confidence: opts.confidence ?? 0,
    },
    metadata: {
      legislation,
      verified: opts.verified ?? false,
      confidence: opts.confidence ?? 0,
      trust: legislation.provenance?.trust ?? "uncertain",
    },
  });
}

/**
 * Record a specific provision/section discovered during research.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - research session ID
 * @param {object} opts - { actNumber, section, text, sourceUrl }
 */
export function addProvision(mem, sessionId, opts = {}) {
  const text = opts.text || `Act ${opts.actNumber} §${opts.section}`;

  return mem.remember(sessionId, {
    text,
    tags: [
      "legal",
      LEGAL_STM_TYPE.PROVISION,
      `legal:act:${opts.actNumber}`,
      `legal:section:${opts.section}`,
    ],
    source: {
      tier: TIER.STM,
      type: "provision",
      sourceUrl: opts.sourceUrl,
      verified: opts.verified ?? false,
    },
    metadata: {
      act_number: opts.actNumber,
      section: opts.section,
      source_url: opts.sourceUrl,
      verified: opts.verified ?? false,
    },
  });
}

/**
 * Record a legal definition found during research.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - research session ID
 * @param {object} opts - { term, definition, actNumber, section, sourceUrl }
 */
export function addDefinition(mem, sessionId, opts = {}) {
  const text = `"${opts.term}": ${opts.definition}`;

  return mem.remember(sessionId, {
    text,
    tags: [
      "legal",
      LEGAL_STM_TYPE.DEFINITION,
      `legal:term:${opts.term}`,
      `legal:act:${opts.actNumber}`,
    ],
    source: {
      tier: TIER.STM,
      type: "definition",
      sourceUrl: opts.sourceUrl,
      verified: opts.verified ?? false,
    },
    metadata: {
      term: opts.term,
      definition: opts.definition,
      act_number: opts.actNumber,
      section: opts.section,
      source_url: opts.sourceUrl,
      verified: opts.verified ?? false,
    },
  });
}

/**
 * Record an amendment relationship discovered during research.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - research session ID
 * @param {object} opts - { amendsAct, amendedBy, relationship, sourceUrl }
 */
export function addRelationship(mem, sessionId, opts = {}) {
  const text = `${opts.amendsAct} ${opts.relationship} ${opts.amendedBy}`;

  return mem.remember(sessionId, {
    text,
    tags: [
      "legal",
      LEGAL_STM_TYPE.RELATIONSHIP,
      `legal:act:${opts.amendsAct}`,
      `legal:relationship:${opts.relationship}`,
    ],
    source: {
      tier: TIER.STM,
      type: "relationship",
      sourceUrl: opts.sourceUrl,
      verified: opts.verified ?? false,
    },
    metadata: {
      act_number: opts.amendsAct,
      related_act: opts.amendedBy,
      relationship: opts.relationship,
      source_url: opts.sourceUrl,
      verified: opts.verified ?? false,
    },
  });
}

/**
 * Record a citation check result during research.
 * Citations must be verified against the authoritative source before
 * being treated as facts.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - research session ID
 * @param {object} opts - { citation, actNumber, verified, sourceUrl }
 */
export function addVerification(mem, sessionId, opts = {}) {
  const text = `Citation verified: Act ${opts.actNumber} — ${opts.verified ? "OK" : "unverified"}`;

  return mem.remember(sessionId, {
    text,
    tags: [
      "legal",
      LEGAL_STM_TYPE.VERIFICATION,
      `legal:act:${opts.actNumber}`,
      `legal:verified:${opts.verified ? "yes" : "no"}`,
    ],
    source: {
      tier: TIER.STM,
      type: "verification",
      sourceUrl: opts.sourceUrl,
    },
    metadata: {
      act_number: opts.actNumber,
      citation: opts.citation,
      verified: opts.verified,
      source_url: opts.sourceUrl,
    },
  });
}

/**
 * Record reasoning/decision context in STM.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - research session ID
 * @param {string} reasoning - the reasoning text
 * @param {object} [opts] - { confidence, conclusion }
 */
export function addReasoning(mem, sessionId, reasoning, opts = {}) {
  return mem.remember(sessionId, {
    text: reasoning,
    tags: ["legal", LEGAL_STM_TYPE.REASONING],
    source: {
      tier: TIER.STM,
      type: "reasoning",
      confidence: opts.confidence ?? 0,
    },
    metadata: {
      reasoning,
      confidence: opts.confidence ?? 0,
      conclusion: opts.conclusion ?? null,
    },
  });
}

/**
 * Record uncertainty about a legal fact.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - research session ID
 * @param {string} subject - what is uncertain
 * @param {string} explanation - why it's uncertain
 */
export function addUncertainty(mem, sessionId, subject, explanation) {
  return mem.remember(sessionId, {
    text: `Uncertain: ${subject} — ${explanation}`,
    tags: ["legal", LEGAL_STM_TYPE.UNCERTAINTY],
    source: { tier: TIER.STM, type: "uncertainty" },
    metadata: { subject, explanation, verified: false },
  });
}

/**
 * Promote legislation from STM to LTM with provenance validation.
 *
 * Implements §12 (learning rules) and §6 (promotion criteria):
 *   candidate → validate → score → deduplicate → promote → persist
 *
 * Only legislation with authoritative provenance and passing
 * validateProvenance() is promoted. Conflicts with existing LTM
 * versions are resolved via version history (§7, §13).
 *
 * @param {object} mem - createMemory() facade
 * @param {string} sessionId - research session ID
 * @param {object} [opts] - { minConfidence, limit, allowUnknownStatus }
 * @returns {object} { promoted: [], skipped: [], conflicts: [], count }
 */
export function promoteLegislationToLTM(mem, sessionId, opts = {}) {
  const minConfidence = opts.minConfidence ?? 0.8;
  const allowUnknownStatus = opts.allowUnknownStatus ?? false;
  const limit = opts.limit ?? 50;

  const stm = mem.stm.all(sessionId).reverse();
  const seen = new Set();
  const promoted = [];
  const skipped = [];
  const conflicts = [];

  for (const entry of stm) {
    if (!entry.tags || !entry.tags.includes(LEGAL_STM_TYPE.LEGISLATION)) continue;
    if (entry.metadata?.promotedToLTM) continue;

    const legislation = entry.metadata?.legislation;
    if (!legislation) continue;

    const key = legislation.act_number;
    if (seen.has(key)) continue;
    seen.add(key);

    if (seen.size > limit) break;

    // Step 1: Validate provenance
    const validation = validateProvenance(legislation);
    if (!validation.valid) {
      skipped.push({ act_number: legislation.act_number, reason: validation.errors.join("; ") });
      continue;
    }

    // Step 2: Score — check confidence and trust
    const trust = legislation.provenance?.trust;
    if (trust !== "authoritative" && !opts.allowSecondary) {
      skipped.push({ act_number: legislation.act_number, reason: "provenance trust not authoritative" });
      continue;
    }

    const confidence = entry.metadata?.confidence ?? 0;
    if (confidence < minConfidence) {
      skipped.push({ act_number: legislation.act_number, reason: `confidence ${confidence} < ${minConfidence}` });
      continue;
    }

    // Step 3: Check for status=unknown with fabricated dates
    if (!allowUnknownStatus && legislation.status === "unknown") {
      skipped.push({ act_number: legislation.act_number, reason: "status is 'unknown' — cannot promote without verification" });
      continue;
    }

    // Step 4: Check for version conflicts with existing LTM entries
    const encoded = encodeForLTM(legislation);
    const existing = mem.ltm.get(encoded.id);

    if (existing) {
      if (detectVersionConflict(existing, legislation)) {
        // Version conflict — resolve by preserving history
        const merged = resolveVersionConflict(existing, legislation);
        const updated = encodeForLTM(merged);
        // Preserve original salience (max of old and new)
        updated.salience = Math.max(existing.salience || 0, updated.salience);
        mem.commit(updated);
        conflicts.push({
          act_number: legislation.act_number,
          resolved: "version-history-preserved",
          newVersion: legislation.version,
        });
        promoted.push({ act_number: legislation.act_number, id: encoded.id, action: "version-updated" });
        entry.metadata.promotedToLTM = encoded.id;
        continue;
      }
      // No conflict — update is a no-op (same version already in LTM)
      skipped.push({ act_number: legislation.act_number, reason: "same version already in LTM" });
      entry.metadata.promotedToLTM = encoded.id;
      continue;
    }

    // Step 5: Promote to LTM
    mem.commit(encoded);
    promoted.push({ act_number: legislation.act_number, id: encoded.id, action: "new-entry" });
    entry.metadata.promotedToLTM = encoded.id;
  }

  return { promoted, skipped, conflicts, count: promoted.length };
}

/**
 * Promote a single verified legislation record to LTM.
 * This is the manual promotion path — used when the agent has verified
 * a record against the official AGC source.
 *
 * @param {object} mem - createMemory() facade
 * @param {object} legislation - verified legislation record
 * @returns {object} { promoted: boolean, entry: object|null, conflicts: object|null }
 */
export function promoteSingleLegislation(mem, legislation) {
  const validation = validateProvenance(legislation);
  if (!validation.valid) {
    return { promoted: false, entry: null, conflicts: null, errors: validation.errors };
  }

  const encoded = encodeForLTM(legislation);
  const existing = mem.ltm.get(encoded.id);

  if (existing && detectVersionConflict(existing, legislation)) {
    const merged = resolveVersionConflict(existing, legislation);
    const updated = encodeForLTM(merged);
    updated.salience = Math.max(existing.salience || 0, updated.salience);
    mem.commit(updated);
    return {
      promoted: true,
      entry: updated,
      conflicts: { type: "version-updated", old_version: existing.metadata?.current?.version },
    };
  }

  if (existing) {
    return { promoted: false, entry: existing, conflicts: null, errors: ["same version already in LTM"] };
  }

  mem.commit(encoded);
  return { promoted: true, entry: encoded, conflicts: null };
}

/**
 * Re-check an existing LTM legislation entry against the official source.
 * Marks the entry's trust level based on verification status.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} actNumber
 * @param {object} verification - { verified: boolean, sourceUrl: string, note: string }
 * @returns {object} updated entry
 */
export function reverifyLegislation(mem, actNumber, verification) {
  const hits = mem.ltm.query({
    kind: "legislation",
    tags: [`legal:act:${actNumber}`],
    limit: 1,
  });

  if (!hits.length) return null;

  const entry = hits[0];
  const record = decodeFromLTM(entry);
  if (!record) return null;

  const trust = verification.verified ? "authoritative" : "uncertain";
  record.provenance = {
    ...record.provenance,
    trust,
    last_verified: new Date().toISOString(),
    verification_note: verification.note ?? null,
  };

  const updated = encodeForLTM(record);
  updated.salience = trust === "authoritative" ? 0.9 : 0.3;
  mem.commit(updated);

  return updated;
}

export default {
  LEGAL_STM_TYPE,
  legalResearchContext,
  addLegislation,
  addProvision,
  addDefinition,
  addRelationship,
  addVerification,
  addReasoning,
  addUncertainty,
  promoteLegislationToLTM,
  promoteSingleLegislation,
  reverifyLegislation,
};
