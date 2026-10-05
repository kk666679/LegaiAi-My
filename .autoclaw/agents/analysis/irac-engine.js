// .autoclaw/agents/analysis/irac-engine.js

export const IRAC_STAGES = ["issue", "rule", "application", "conclusion"];

/** Parse the legal issue from a fact pattern. */
export function parseIssue(input) {
  if (!input) return "";
  if (typeof input === "string") return input.trim();
  if (input.issue) return String(input.issue).trim();
  if (input.question) return String(input.question).trim();
  if (Array.isArray(input.facts) && input.facts.length) {
    const f = input.facts[0];
    return typeof f === "string" ? f.trim() : String(f?.text ?? f?.issue ?? "").trim();
  }
  return "";
}

/** Rank authorities by strength for a given issue. */
export function rankAuthority(authorities = [], _issue = "") {
  const WEIGHT = { constitution: 100, statute: 80, regulation: 60, case: 50, secondary: 20 };
  return [...authorities]
    .map((a) => ({
      authority: a,
      score:
        (WEIGHT[a?.kind ?? a?.type] ?? 10) +
        (a?.binding ? 20 : 0) +
        (a?.year ? Math.max(0, 20 - (2026 - a.year)) : 0),
    }))
    .sort((x, y) => y.score - x.score);
}

/** Distinguish a case from a set of precedents. */
export function distinguishCases(target, precedents = []) {
  const t = String(target ?? "").toLowerCase();
  return precedents.map((p) => {
    const name = String(p?.title ?? p?.name ?? "").toLowerCase();
    const same = t && name && (t.includes(name) || name.includes(t));
    return { precedent: p, distinguishable: !same, reason: same ? "on point" : "materially different facts" };
  });
}

/** Detect conflicting rules/authorities. */
export function detectConflicts(rules = []) {
  const conflicts = [];
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i], b = rules[j];
      if (a?.conclusion && b?.conclusion && a.conclusion !== b.conclusion && a?.subject === b?.subject) {
        conflicts.push({ a, b, reason: "same subject, different conclusion" });
      }
    }
  }
  return conflicts;
}

/** Apply rules to facts and return matched applications. */
export function applyRulesToFacts(facts = [], rules = []) {
  const apps = [];
  for (const fact of facts) {
    for (const rule of rules) {
      if (matches(rule, fact)) {
        apps.push({ fact, rule, conclusion: rule?.conclusion ?? null, confidence: 0.5 });
      }
    }
  }
  return apps;
}

function matches(rule, fact) {
  if (!rule?.pattern) return true;
  if (typeof rule.pattern === "function") return rule.pattern(fact);
  if (rule.pattern instanceof RegExp) return rule.pattern.test(String(fact?.text ?? fact));
  if (typeof rule.pattern === "string") return String(fact?.text ?? fact).includes(rule.pattern);
  return false;
}

/** Build a complete IRAC analysis. */
export function buildIRAC(input = {}) {
  const issue = parseIssue(input);
  const rules = input.rules ?? input.authorities ?? [];
  const rankedRules = rankAuthority(rules, issue).map((r) => r.authority);
  const applications = applyRulesToFacts(input.facts ?? [], rankedRules);
  const conflicts = detectConflicts(rankedRules);
  const conclusion = applications.length ? applications[0].conclusion ?? "" : "";
  return {
    issue, rule: rankedRules, application: applications, conclusion,
    conflicts, confidence: 0, authorities: input.authorities ?? [],
  };
}

export class IRACEngine {
  constructor(opts = {}) { this.opts = opts; }
  async analyse(input = {}) { return buildIRAC(input); }
  analyseSync(input = {}) { return buildIRAC(input); }
}

export function createIRACEngine(opts) { return new IRACEngine(opts); }
export function runIRAC(input, opts) { return new IRACEngine(opts).analyse(input); }

export default {
  parseIssue, rankAuthority, distinguishCases, detectConflicts, applyRulesToFacts, buildIRAC,
  IRACEngine, createIRACEngine, runIRAC, IRAC_STAGES,
};
