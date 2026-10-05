'use strict';

/**
 * CHAINS — the skill sequence bound to each registry agent.
 *
 *   skills   — ordered skill ids, run in order
 *   merge    — build the agent output from the per-skill outputs
 *   escalate — 'never' | 'empty' | fn(output) → reason
 *
 * Keys are the agent ids in `registry/catalog.js`. Adding a 12th agent means
 * one entry here plus one catalogue row; the runtime, router and CLI pick it up
 * with no other change. A registry agent with no chain here fails loudly at
 * `invoke()` rather than degrading to a no-op that looks like success.
 */

const CHAINS = Object.freeze({
  'issue-spotter': Object.freeze({
    skills: ['issue.extract', 'issue.rank'],
    merge: o => ({ issues: (o['issue.rank'] || o['issue.extract'] || {}).issues || [] }),
    escalate: 'empty'
  }),

  'rule-finder': Object.freeze({
    skills: ['rule.lookup', 'rule.synthesize'],
    merge: o => ({ rules: (o['rule.synthesize'] || o['rule.lookup'] || {}).rules || [] }),
    escalate: 'empty'
  }),

  'precedent-analyst': Object.freeze({
    skills: ['precedent.retrieve', 'precedent.compare'],
    merge: o => {
      const r = o['precedent.compare'] || o['precedent.retrieve'] || {};
      return { precedents: r.precedents || [], analysis: r.analysis || '' };
    },
    escalate: 'empty'
  }),

  'statute-interpreter': Object.freeze({
    skills: ['rule.lookup', 'application.map'],
    merge: o => {
      const r = o['application.map'] || o['rule.lookup'] || {};
      return { provisions: r.provisions || r.rules || [], analysis: r.analysis || '' };
    },
    escalate: 'empty'
  }),

  'citation-validator': Object.freeze({
    skills: ['validate.citation', 'validate.consistency'],
    merge: o => {
      const c = o['validate.citation'] || {};
      const k = o['validate.consistency'] || {};
      return {
        vote: c.vote || 'abstain',
        confidence: Math.min(Number(c.confidence) || 0, Number(k.confidence) || 1),
        rationale: c.rationale || k.rationale || '',
        citations: c.citations || []
      };
    },
    escalate: 'never'
  }),

  drafter: Object.freeze({
    skills: ['draft.compose', 'conclusion.write'],
    merge: o => ({
      document: (o['draft.compose'] || {}).document || '',
      conclusion: (o['conclusion.write'] || {}).conclusion || ''
    }),
    escalate: 'empty'
  }),

  'devil-advocate': Object.freeze({
    skills: ['argument.construct', 'validate.logic'],
    merge: o => {
      const a = o['argument.construct'] || {};
      const v = o['validate.logic'] || {};
      return {
        counterarguments: a.counterarguments || [],
        vote: v.vote || 'abstain',
        confidence: Number(v.confidence) || 0,
        rationale: v.rationale || ''
      };
    },
    escalate: 'never'
  }),

  'risk-scorer': Object.freeze({
    skills: ['risk.assess', 'risk.quantify'],
    merge: o => {
      const q = o['risk.quantify'] || o['risk.assess'] || {};
      return { risks: q.risks || [], exposure: Number.isFinite(q.exposure) ? q.exposure : null };
    },
    escalate: 'empty'
  }),

  summariser: Object.freeze({
    skills: ['summarize.long'],
    merge: o => ({ summary: (o['summarize.long'] || {}).summary || '' }),
    escalate: 'empty'
  }),

  'translator-ms': Object.freeze({
    skills: ['translate.en-ms'],
    merge: o => ({ text: (o['translate.en-ms'] || {}).text || '', lang: 'ms' }),
    escalate: 'never'
  }),

  'qa-reviewer': Object.freeze({
    skills: ['validate.consistency', 'validate.citation', 'validate.logic'],
    merge: o => {
      const k = o['validate.consistency'] || {};
      const c = o['validate.citation'] || {};
      const l = o['validate.logic'] || {};
      const votes = [k.vote, c.vote, l.vote].filter(Boolean);
      const no = votes.filter(v => v === 'no').length;
      const yes = votes.filter(v => v === 'yes').length;
      // Minority-veto: one dissent blocks a QA pass. Confidence is the lowest
      // reported — the weakest reviewer sets the bar, not the average.
      const confidences = [k, c, l].map(x => Number(x.confidence)).filter(Number.isFinite);
      return {
        vote: no > 0 ? 'no' : (yes > 0 && yes === votes.length ? 'yes' : 'abstain'),
        confidence: confidences.length ? Math.min(...confidences) : 0,
        rationale: [k.rationale, c.rationale, l.rationale].filter(Boolean).join('; '),
        findings: [...(k.findings || []), ...(c.findings || []), ...(l.findings || [])]
      };
    },
    escalate: 'never'
  })
});

module.exports = { CHAINS };