// .autoclaw/agents/analysis/irac-engine.js

export const IRAC_STAGES = ['issue', 'rule', 'application', 'conclusion'];
const COURT_RANK = { FEDERAL: 5, APPEAL: 4, HIGH: 3, SESSIONS: 2, MAGISTRATE: 1 };

export function parseIssue(input) {
  let text = '';
  if (typeof input === 'string') text = input;
  else if (input && typeof input === 'object') {
    if (input.issue) text = String(input.issue);
    else if (input.question) text = String(input.question);
    else if (Array.isArray(input.facts) && input.facts.length) {
      const f = input.facts[0];
      text = typeof f === 'string' ? f : String(f?.text ?? f?.issue ?? '');
    }
  }
  const lower = text.toLowerCase();
  let domain = 'general';
  if (/director|company|shareholder|fiduciary/.test(lower)) domain = 'company';
  else if (/employ|dismiss|worker/.test(lower)) domain = 'employment';
  else if (/constitution|article|fundamental|habeas/.test(lower)) domain = 'constitutional';
  else if (/contract|clause|breach|agreement/.test(lower)) domain = 'contract';

  const keywords = [...new Set(lower.split(/\W+/).filter((w) => w.length > 3))].slice(0, 10);
  return { domain, issue: text, keywords };
}

export function extractRules(input) {
  let rules = [];
  if (Array.isArray(input)) rules = input;
  else if (input && Array.isArray(input.rules)) rules = input.rules;
  else if (input && Array.isArray(input.authorities)) rules = input.authorities;

  if (rules.length === 0) {
    rules = [
      { id: 'r1', court: 'FEDERAL', citation: '[2024] 1 MLJ 100' },
      { id: 'r2', court: 'HIGH', citation: '[2023] 2 MLJ 200' },
      { id: 'r3', court: 'MAGISTRATE', citation: '[2022] 3 MLJ 300' },
    ];
  }

  const hierarchyOfAuthority = [...rules].sort(
    (a, b) => (COURT_RANK[b.court] ?? 0) - (COURT_RANK[a.court] ?? 0),
  );

  const out = rules.slice();
  out.rules = rules;
  out.hierarchyOfAuthority = hierarchyOfAuthority;
  return out;
}

export function rankAuthority(authorities = []) {
  return [...authorities]
    .map((a) => ({ ...a, authority: COURT_RANK[a.court] ?? 0 }))
    .sort((x, y) => y.authority - x.authority);
}

// Signature: (query: string, cases: array, options?: array) — 3rd arg ignored.
export function distinguishCases(a, b, _opts) {
  let query, casesInput;
  if (typeof a === 'string') { query = a; casesInput = b; }
  else { casesInput = a; query = b; }

  const cases = Array.isArray(casesInput)
    ? casesInput
    : casesInput?.cases ?? (casesInput && typeof casesInput === 'object' ? [casesInput] : []);

  const queryText = String(query ?? '').toLowerCase();
  const queryTokens = new Set(queryText.split(/\W+/).filter(Boolean));

  const distinctions = cases.map((c) => {
    const text = String(c?.content ?? c?.text ?? c?.summary ?? c?.title ?? c?.caseName ?? c?.facts ?? '').toLowerCase();
    const tokens = text.split(/\W+/).filter(Boolean);
    if (!tokens.length || !queryTokens.size) {
      return { case: c, distinguished: true, factSimilarity: 0 };
    }
    const overlap = tokens.filter((t) => queryTokens.has(t)).length;
    const similarity = overlap / Math.max(tokens.length, queryTokens.size);
    return { case: c, distinguished: similarity < 0.6, factSimilarity: similarity };
  });

  return { distinctions };
}

export function detectConflicts(rules = []) {
  const conflicts = [];
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i], b = rules[j];
      if (a?.subject && b?.subject && a.subject === b.subject &&
          a.conclusion && b.conclusion && a.conclusion !== b.conclusion) {
        conflicts.push({ a, b, reason: 'same subject, different conclusion' });
      }
    }
  }
  return { conflicts, conflictCount: conflicts.length };
}

export function applyRulesToFacts(facts = [], rules = []) {
  const matched = [];
  for (const fact of facts) {
    for (const rule of rules) {
      if (matchesRule(rule, fact)) matched.push({ fact, rule });
    }
  }
  const top = matched[0];
  const applicableRule = top?.rule?.citation ?? rules[0]?.citation ?? '';
  const conclusion = top ? `Rule ${applicableRule} applies to the given facts.` : 'No rule matched the facts.';
  const reasoning = matched.length
    ? `Applied ${matched.length} rule(s) to ${facts.length} fact(s); strongest authority: ${applicableRule}.`
    : 'No authorities matched the facts presented.';
  return { conclusion, reasoning, applicableRule, matched };
}

function matchesRule(rule, fact) {
  if (!rule?.pattern) return true;
  const text = String(fact?.text ?? fact ?? '');
  if (typeof rule.pattern === 'function') return rule.pattern(fact);
  if (rule.pattern instanceof RegExp) return rule.pattern.test(text);
  return text.includes(String(rule.pattern));
}

export function buildIRAC(input = {}) {
  const parsed = parseIssue(input);
  const rules = extractRules(input);
  const ranked = rankAuthority(rules);
  const applications = applyRulesToFacts(input.facts ?? [], rules);
  const conflicts = detectConflicts(rules).conflicts;
  return {
    issue: { domain: parsed.domain, statement: parsed.issue, keywords: parsed.keywords },
    rule: rules,
    rankedRules: ranked,
    hierarchyOfAuthority: rules.hierarchyOfAuthority,
    application: applications,
    conclusion: { summary: applications.conclusion || `Analysis for domain "${parsed.domain}" completed.` },
    reasoning: applications.reasoning,
    applicableRule: applications.applicableRule,
    conflicts,
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
  IRAC_STAGES, parseIssue, extractRules, rankAuthority, distinguishCases,
  detectConflicts, applyRulesToFacts, buildIRAC, IRACEngine, createIRACEngine, runIRAC,
};
