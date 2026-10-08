// .autoclaw/learnings/legal-retrieval.mjs
// Legal Retrieval — targeted retrieval of Malaysian federal legislation
// from the AutoClaw STM/LTM memory system.
//
// Implements §8 (Legal Retrieval) of the learning task.
// Retrieval prioritizes:
//   1. Exact legislation/document identifier (Act number)
//   2. Exact title
//   3. Relevant section/provision
//   4. Current version/status
//   5. Related legislation
//   6. Official source provenance

import { normalizeActNumber, LEGAL_STATUS } from "../memory/interfaces/lom-client.mjs";
import { decodeFromLTM, legalEntryId, legalScore } from "./legal-knowledge.mjs";

/**
 * Retrieve legislation by exact Act number.
 * Highest priority (§8 priority 1).
 *
 * @param {object} mem - createMemory() facade
 * @param {string} actNumber - e.g. "884", "Act 884", "A1234"
 * @param {object} [opts] - { limit, includeHistorical }
 * @returns {Array} LTM entries matching the Act number
 */
export function retrieveByActNumber(mem, actNumber, opts = {}) {
  const num = normalizeActNumber(actNumber);
  if (!num) return [];

  const tags = [`legal:act:${num}`];
  const hits = mem.ltm.query({
    kind: "legislation",
    tags,
    limit: opts.limit || 10,
  });

  return _annotateAndSort(hits, actNumber, opts);
}

/**
 * Retrieve legislation by exact or fuzzy title.
 * Priority 2 (§8).
 *
 * @param {object} mem - createMemory() facade
 * @param {string} title - e.g. "Companies Act 2016"
 * @param {object} [opts] - { limit, exact }
 * @returns {Array} Matching legislation entries
 */
export function retrieveByTitle(mem, title, opts = {}) {
  if (!title) return [];

  const results = [];
  for (const entry of _allLegislation(mem)) {
    const record = decodeFromLTM(entry);
    if (!record || !record.title) continue;

    const exact = record.title.toLowerCase() === title.toLowerCase();
    const fuzzy = record.title.toLowerCase().includes(title.toLowerCase());

    if (exact || (!opts.exact && fuzzy)) {
      results.push({
        ...entry,
        _match: { type: exact ? "exact" : "fuzzy", field: "title", value: record.title },
      });
    }
  }

  return _sortWithPriority(results, opts.limit || 10);
}

/**
 * Retrieve legislation relevant to a topic or keyword.
 * Priority 3 (§8).
 *
 * @param {object} mem - createMemory() facade
 * @param {string} topic - e.g. "company registration", "unfair dismissal"
 * @param {object} [opts] - { limit }
 * @returns {Array} Matching legislation entries ranked by relevance
 */
export function retrieveByTopic(mem, topic, opts = {}) {
  return _searchByText(mem, topic, opts);
}

/**
 * Retrieve the current version of a given Act.
 * Prefers status="current" over amended/repealed/historical (priority 4).
 *
 * @param {object} mem - createMemory() facade
 * @param {string} actNumber
 * @returns {object|null} Single LTM entry or null
 */
export function retrieveCurrentVersion(mem, actNumber) {
  const hits = retrieveByActNumber(mem, actNumber, { includeHistorical: false, limit: 50 });

  // Prefer status=current, then amended, then unknown, then historical
  const priorityOrder = [
    LEGAL_STATUS.CURRENT,
    LEGAL_STATUS.AMENDED,
    LEGAL_STATUS.UNKNOWN,
    LEGAL_STATUS.HISTORICAL,
    LEGAL_STATUS.REPEALED,
  ];

  for (const status of priorityOrder) {
    const match = hits.find((h) => {
      const rec = decodeFromLTM(h);
      return rec && rec.status === status;
    });
    if (match) return match;
  }

  return hits.length ? hits[0] : null;
}

/**
 * Retrieve all known versions of a given Act (current + historical).
 * Versions are returned newest-first.
 *
 * @param {object} mem - createMemory() facade
 * @param {string} actNumber
 * @returns {Array} Version entries from metadata.versions, newest-first
 */
export function retrieveAllVersions(mem, actNumber) {
  const current = retrieveByActNumber(mem, actNumber, { includeHistorical: true, limit: 1 });
  if (!current.length) return [];

  const entry = current[0];
  const versions = entry.metadata?.versions || [];
  if (!versions.length) {
    // Fallback: reconstruct from history + current
    const record = decodeFromLTM(entry);
    if (!record) return [];
    return [
      {
        version: record.version,
        content_hash: record.content_hash,
        status: record.status,
        provenance: record.provenance,
        is_current: true,
      },
      ...(record.history || []).map((h) => ({ ...h, is_current: false })),
    ];
  }

  return versions.map((v, i) => ({ ...v, is_current: i === 0 }));
}

/**
 * Retrieve amendments to a parent Act.
 * Priority 5 (§8).
 *
 * @param {object} mem - createMemory() facade
 * @param {string} parentActNumber - e.g. "884"
 * @param {object} [opts] - { limit }
 * @returns {Array} Amendment records
 */
export function retrieveAmendments(mem, parentActNumber, opts = {}) {
  const parent = normalizeActNumber(parentActNumber);
  if (!parent) return [];

  const results = [];
  for (const entry of _allLegislation(mem)) {
    const record = decodeFromLTM(entry);
    if (!record) continue;

    const isAmendment = record.type === "amendment" || record.type === "pu_a";
    const targetsParent = record.parent_act === parent ||
      (record.relationships || []).some((r) => r.type === "amends" && r.target_act === parent);

    if (isAmendment && targetsParent) {
      results.push({
        ...entry,
        _match: { type: "amendment_of", parent: parent },
      });
    }
  }

  return _sortWithPriority(results, opts.limit || 50);
}

/**
 * Retrieve subsidiary legislation (P.U. (A) / P.U. (B)) under a parent Act.
 * Priority 5 (§8).
 *
 * @param {object} mem - createMemory() facade
 * @param {string} parentActNumber
 * @param {object} [opts] - { limit }
 * @returns {Array} Subsidiary legislation entries
 */
export function retrieveSubsidiary(mem, parentActNumber, opts = {}) {
  const parent = normalizeActNumber(parentActNumber);
  if (!parent) return [];

  const results = [];
  for (const entry of _allLegislation(mem)) {
    const record = decodeFromLTM(entry);
    if (!record) continue;

    const isSubsidiary = ["subsidiary", "pu_a", "pu_b"].includes(record.type);
    const underParent = record.parent_act === parent ||
      (record.relationships || []).some((r) => r.type === "subsidiary_of" && r.target_act === parent);

    if (isSubsidiary && underParent) {
      results.push({
        ...entry,
        _match: { type: "subsidiary_of", parent: parent },
      });
    }
  }

  return _sortWithPriority(results, opts.limit || 50);
}

/**
 * Unified legal query with priority-ordered results.
 *
 * Implements the §8 priority ordering:
 *   1. Exact Act number
 *   2. Exact title
 *   3. Topic/section relevance
 *   4. Current version preference
 *   5. Related legislation (amendments/subsidiary)
 *   6. Provenance ranking
 *
 * @param {object} mem - createMemory() facade
 * @param {object} opts - { query, actNumber, title, topic, sessionId, limit }
 * @returns {Array} Prioritized results with _priority field
 */
export function legalQuery(mem, opts = {}) {
  let results = [];
  let priority = 1;

  if (opts.actNumber) {
    for (const hit of retrieveByActNumber(mem, opts.actNumber, { limit: opts.limit })) {
      results.push({ ...hit, _priority: priority });
    }
    priority += 5;
  }

  if (opts.title) {
    for (const hit of retrieveByTitle(mem, opts.title, { limit: opts.limit })) {
      results.push({ ...hit, _priority: priority });
    }
    priority += 5;
  }

  if (opts.query || opts.topic) {
    const q = opts.query || opts.topic;
    for (const hit of retrieveByTopic(mem, q, { limit: opts.limit })) {
      results.push({ ...hit, _priority: priority });
    }
    priority += 5;
  }

  // De-duplicate by LTM entry id, keeping highest priority (lowest _priority number)
  const byId = new Map();
  for (const r of results) {
    const key = r.id;
    if (!byId.has(key) || (r._priority || 0) < (byId.get(key)._priority || 0)) {
      byId.set(key, r);
    }
  }

  // Sort: priority first, then LTM salience, then legal score
  return Array.from(byId.values())
    .sort((a, b) => {
      const pa = a._priority || 99;
      const pb = b._priority || 99;
      if (pa !== pb) return pa - pb;
      const sa = b.salience || 0;
      const sb = a.salience || 0;
      return sa - sb;
    })
    .slice(0, opts.limit || 10);
}

/**
 * Inject legal context into the current context window.
 * Retrieves relevant LTM legislation and returns a compact context string
 * suitable for prompt construction (§10 context injection).
 *
 * @param {object} mem - createMemory() facade
 * @param {object} opts - { query, actNumber, limit }
 * @returns {string} Compact context string with provenance
 */
export function injectLegalContext(mem, opts = {}) {
  const hits = legalQuery(mem, opts);
  if (!hits.length) return "";

  const lines = [];
  for (const hit of hits) {
    const record = decodeFromLTM(hit);
    if (!record) continue;
    const url = record.provenance?.source_url ?? "";
    const trust = record.provenance?.trust ?? "uncertain";
    const statusTag = `[${record.status}]`;
    lines.push(
      `${statusTag} ${record.title} (Act ${record.act_number}) — ${record.type} — ${trust}${url ? " — " + url : ""}`
    );
  }

  return lines.join("\n");
}

// --- Internal helpers ---

function _allLegislation(mem) {
  return mem.ltm.byKind("legislation") || [];
}

function _searchByText(mem, query, opts = {}) {
  return _allLegislation(mem)
    .map((entry) => {
      const record = decodeFromLTM(entry);
      if (!record) return null;
      const score = legalScore(record, query);
      if (score <= 0) return null;
      return { ...entry, _score: score, _match: { type: "topic", value: query } };
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score)
    .slice(0, opts.limit || 10);
}

function _annotateAndSort(hits, actNumber, opts = {}) {
  const includeHistorical = opts.includeHistorical === true;
  let results = hits.map((h) => {
    const record = decodeFromLTM(h);
    return { ...h, _match: { type: "act_number", value: actNumber } };
  });

  if (!includeHistorical) {
    results = results.filter((h) => {
      const rec = decodeFromLTM(h);
      return rec && rec.status !== LEGAL_STATUS.HISTORICAL && rec.status !== LEGAL_STATUS.REPEALED;
    });
  }

  return results.sort((a, b) => {
    // Current version first
    const ra = decodeFromLTM(a);
    const rb = decodeFromLTM(b);
    if (ra?.status === LEGAL_STATUS.CURRENT && rb?.status !== LEGAL_STATUS.CURRENT) return -1;
    if (rb?.status === LEGAL_STATUS.CURRENT && ra?.status !== LEGAL_STATUS.CURRENT) return 1;
    // Then by salience (authoritative first)
    return (rb?.salience || 0) - (ra?.salience || 0);
  });
}

function _sortWithPriority(results, limit) {
  return results
    .sort((a, b) => {
      const ra = decodeFromLTM(a) || a;
      const rb = decodeFromLTM(b) || b;
      if (ra?.status === LEGAL_STATUS.CURRENT && rb?.status !== LEGAL_STATUS.CURRENT) return -1;
      if (rb?.status === LEGAL_STATUS.CURRENT && ra?.status !== LEGAL_STATUS.CURRENT) return 1;
      return (rb?.salience || 0) - (ra?.salience || 0);
    })
    .slice(0, limit);
}

export default {
  retrieveByActNumber,
  retrieveByTitle,
  retrieveByTopic,
  retrieveCurrentVersion,
  retrieveAllVersions,
  retrieveAmendments,
  retrieveSubsidiary,
  legalQuery,
  injectLegalContext,
};
