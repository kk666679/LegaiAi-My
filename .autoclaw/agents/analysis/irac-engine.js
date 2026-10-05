const COURT_RANK = Object.freeze({
  FEDERAL: 5,
  APPEAL: 4,
  HIGH: 3,
  SESSIONS: 2,
  MAGISTRATE: 1,
  UNKNOWN: 0,
});

function guessDomain(text = '') {
  const lower = String(text || '').toLowerCase();

  if (/director|company|shareholder|board|fiduciary|corporate/.test(lower)) return 'company';
  if (/employee|dismiss|termination|employer|contract of employment/.test(lower)) return 'employment';
  if (/constitution|article\s*5|article\s*8|fundamental liberty|right/.test(lower)) return 'constitutional';
  if (/contract|agreement|damages|breach/.test(lower)) return 'contract';

  return 'general';
}

export function parseIssue(text = '') {
  const issue = String(text || '').trim();
  const lower = issue.toLowerCase();
  const keywords = [...new Set(lower.match(/[a-z]+/g) || [])].filter((word) => word.length > 3);

  return {
    domain: guessDomain(issue),
    issue,
    keywords,
  };
}

export function extractRules(cases = []) {
  const rules = (Array.isArray(cases) ? cases : []).map((item) => ({
    id: item.id || item.citation || Math.random().toString(36).slice(2),
    citation: item.citation || 'Unknown citation',
    court: String(item.court || 'UNKNOWN').toUpperCase(),
    ratio: item.content || item.ratio || 'No ratio extracted',
    ratioConfidence: Number(item.ratioConfidence || 0.75),
  }));

  const hierarchyOfAuthority = [...rules].sort((a, b) => (COURT_RANK[b.court] || 0) - (COURT_RANK[a.court] || 0));

  return {
    rules,
    hierarchyOfAuthority,
  };
}

export function rankAuthority(cases = []) {
  return (Array.isArray(cases) ? cases : [])
    .map((item) => ({
      citation: item.citation || 'Unknown citation',
      court: String(item.court || 'UNKNOWN').toUpperCase(),
      authority: COURT_RANK[String(item.court || 'UNKNOWN').toUpperCase()] || 0,
    }))
    .sort((a, b) => b.authority - a.authority);
}

export function distinguishCases(query = '', cases = [], previousCases = []) {
  const target = String(query || '').toLowerCase();
  const normalizedCases = Array.isArray(cases) ? cases : [];

  const distinctions = normalizedCases.map((item) => {
    const content = String(item.content || '').toLowerCase();
    const overlapping = [...new Set((target.match(/[a-z]+/g) || []).filter((word) => word.length > 3))]
      .filter((word) => content.includes(word));
    const factSimilarity = overlapping.length === 0 ? 0 : Math.min(1, overlapping.length / 5);

    return {
      citation: item.citation || 'Unknown citation',
      factSimilarity,
      distinguished: factSimilarity < 0.6,
    };
  });

  return {
    query,
    distinctions,
    priorCases: Array.isArray(previousCases) ? previousCases.length : 0,
  };
}

export function detectConflicts(rules = []) {
  const normalizedRules = Array.isArray(rules) ? rules : [];
  const conflicts = [];

  for (let i = 0; i < normalizedRules.length; i += 1) {
    for (let j = i + 1; j < normalizedRules.length; j += 1) {
      const a = String(normalizedRules[i].ratio || '').toLowerCase();
      const b = String(normalizedRules[j].ratio || '').toLowerCase();
      const hasNegation = (text) => /not liable|not entitled|cannot|does not|not valid/.test(text);
      const hasPositive = (text) => /liable|entitled|valid|must/.test(text);
      if ((hasPositive(a) && hasNegation(b)) || (hasNegation(a) && hasPositive(b))) {
        conflicts.push({
          left: normalizedRules[i].citation,
          right: normalizedRules[j].citation,
          reason: 'Contradictory holdings',
        });
      }
    }
  }

  return {
    conflictCount: conflicts.length,
    conflicts,
  };
}

export function applyRulesToFacts(facts = '', rules = [], issue = '') {
  const factText = String(facts || '');
  const ruleSet = Array.isArray(rules) ? rules : [];
  const applicableRule = ruleSet[0]?.citation || 'No direct rule found';

  const reasoning = [];
  if (ruleSet.length > 0) {
    for (const rule of ruleSet) {
      reasoning.push(`The legal principle in ${rule.citation} is relevant to ${issue || 'the issue at hand'}.`);
    }
  }

  return {
    applicableRule,
    conclusion: [
      `On the facts provided, the governing principle is ${applicableRule}.`,
      `The circumstances described in "${factText}" are materially consistent with the rule.`,
    ],
    reasoning,
  };
}

export function buildIRAC(query = '', cases = [], facts = '') {
  const issue = parseIssue(query);
  const rules = extractRules(cases);
  const application = applyRulesToFacts(facts, rules.rules, query);
  const conclusionText = `Based on the issue ${issue.issue}, the court would likely follow the most authoritative authority and apply the rule to the present facts.`;

  return {
    issue,
    rule: {
      citations: rules.rules.map((item) => item.citation),
      hierarchyOfAuthority: rules.hierarchyOfAuthority,
      summary: `The strongest authority is ${rules.hierarchyOfAuthority[0]?.citation || 'no authority specified'}.`,
    },
    application: {
      facts,
      reasoning: application.reasoning,
      applicableRule: application.applicableRule,
    },
    conclusion: {
      summary: [conclusionText],
      outcome: 'Likely valid',
    },
  };
}
