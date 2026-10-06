#!/usr/bin/env node
import { createRuntime, route, TYPE_MAP } from '../agents/index.js';
import { Registry } from '../registry/index.js';
import { Logger } from '../observability/index.js';

'use strict';

/**
 * agents — invoke, route and inspect the registry agents.
 *
 * The demo skill implementations below are deterministic stand-ins so the
 * chains, the router and the report shape can be exercised without a model.
 * `node bin/agents.js invoke` prints the report any agent returns.
 */

function pad(s, n) { return String(s).padEnd(n, ' '); }

/** Deterministic stand-ins for every skill id the chains reference.
 *  Downstream skills read the previous step through `ctx.prev` / `ctx.outputs`,
 *  never by guessing at the shape of `input`. */
function demoSkills() {
  const sentences = t => String(t || '').split(/[?.!]+/).map(s => s.trim()).filter(Boolean);
  const refsOf = t => [...String(t || '').matchAll(/\[([A-Za-z0-9_.:-]+)\]/g)].map(m => m[1]);
  const prev = ctx => (ctx && ctx.prev) || {};
  const out = (ctx, skill) => (ctx && ctx.outputs && ctx.outputs[skill]) || {};

  return {
    'issue.extract':     async ({ query }) => ({ issues: sentences(query) }),
    'issue.rank':        async ({ issues }, ctx) => ({ issues: issues || out(ctx, 'issue.extract').issues || [] }),
    'rule.lookup':       async ({ q = '', issues = [] } = {}) => ({ rules: [{ id: 'R1', text: 'Employment Act 1955 s.14' }, { id: 'R2', text: `relevant to: ${q || issues.join('; ')}` }] }),
    'rule.synthesize':   async ({ rules } = {}, ctx) => ({ rules: rules || prev(ctx).rules || [] }),
    'precedent.retrieve': async ({ citation } = {}) => ({ precedents: citation ? [{ id: citation }] : [] }),
    'precedent.compare': async ({ precedents } = {}, ctx) => {
      const list = precedents || prev(ctx).precedents || [];
      return { precedents: list, analysis: `Compared ${list.length} precedent(s).` };
    },
    'application.map':   async ({ rules = [], issues = [] } = {}, ctx) => {
      const provisions = rules.length ? rules : (prev(ctx).rules || []);
      return { provisions, analysis: `Applies ${provisions.length} provision(s) to ${issues.length} issue(s).` };
    },
    'conclusion.write':  async ({ analysis } = {}, ctx) => ({ conclusion: `On the analysis: ${analysis || prev(ctx).analysis || 'insufficient authority'}` }),
    'draft.compose':     async ({ docType = 'Affidavit' } = {}) => ({ document: `${docType}\n\n1. The deponent is the claimant.` }),
    'validate.citation': async ({ proposal = '', rules = [] } = {}) => {
      const found = refsOf(proposal);
      const known = new Set(rules.map(r => r.id || r));
      const unknown = found.filter(r => !known.has(r));
      return unknown.length
        ? { vote: 'no', confidence: 0.8, rationale: `unknown citation: ${unknown.join(', ')}`, citations: found }
        : { vote: 'yes', confidence: 0.85, rationale: 'all citations resolve', citations: found };
    },
    'validate.consistency': async () => ({ vote: 'yes', confidence: 0.8, rationale: 'internally consistent', findings: [] }),
    'validate.logic':    async () => ({ vote: 'yes', confidence: 0.7, rationale: 'reasoning shape holds', findings: [] }),
    'argument.construct': async ({ conclusion = '' } = {}) => ({ counterarguments: [`The court could find ${conclusion ? 'the test unmet' : 'no cause of action'}.`] }),
    'risk.assess':       async ({ risks } = {}) => ({ risks: risks || [{ risk: 'costs', level: 'medium' }] }),
    'risk.quantify':     async ({ risks } = {}, ctx) => ({ risks: risks || prev(ctx).risks || [{ risk: 'costs', level: 'medium' }], exposure: 25000 }),
    'summarize.long':    async ({ text = '', hits = [] } = {}) => ({ summary: (text || hits.map(h => h.title || h.id).join('; ')).slice(0, 120) }),
    'translate.en-ms':   async ({ text } = {}) => ({ text: String(text || '').replace(/\bthe\b/gi, 'itu'), lang: 'ms' })
  };
}

function usage() {
  console.log([
    'agents — invoke, route and inspect the registry agents',
    '',
    'Usage:',
    '  node bin/agents.js list',
    '  node bin/agents.js show <id>',
    '  node bin/agents.js invoke <id> <json>',
    '  node bin/agents.js route <json>',
    '  node bin/agents.js types',
    '  node bin/agents.js stats'
  ].join('\n'));
}

(async () => {
  const argv = process.argv.slice(2);
  const [cmd, a1, a2] = argv;
  const verbose = argv.includes('--verbose') || argv.includes('-v');
  // A private registry: `defaultRegistry` is process-wide and refuses
  // re-binding an impl, which would make a second runtime in one process lie.
  // Logging is silent unless asked, so stdout carries only the payload.
  const runtime = createRuntime({
    registry: new Registry(),
    skills: demoSkills(),
    deps: { logger: new Logger({ level: verbose ? 'info' : 'silent' }) }
  });

  switch (cmd) {
    case 'list': {
      const rows = runtime.listMeta();
      const w = Math.max(6, ...rows.map(r => r.id.length)) + 2;
      console.log(pad('agent', w) + pad('role', 11) + pad('hitl', 5) + pad('model', 20) + 'chain');
      console.log(pad('-'.repeat(w), w) + pad('-'.repeat(11), 11) + pad('-'.repeat(5), 5) + pad('-'.repeat(20), 20) + '-----');
      for (const r of rows) {
        console.log(pad(r.id, w) + pad(r.role || '-', 11) + pad(String(r.hitlLevel ?? '-'), 5) + pad(r.model || '-', 20) + (r.skills.join(' → ') || '(none)'));
      }
      console.log(`\n${rows.length} agents`);
      return;
    }

    case 'show': {
      if (!a1) { console.error('usage: node bin/agents.js show <id>'); process.exit(1); }
      const agent = runtime.get(a1);
      console.log(JSON.stringify({
        meta: agent.meta,
        chain: { skills: agent.skills, escalate: agent.chain.escalate }
      }, null, 2));
      return;
    }

    case 'invoke': {
      if (!a1) { console.error('usage: node bin/agents.js invoke <id> <json>'); process.exit(1); }
      const input = a2 ? JSON.parse(a2) : {};
      const out = await runtime.invoke(a1, input);
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    case 'route': {
      console.log(JSON.stringify(route(a1 ? JSON.parse(a1) : {}), null, 2));
      return;
    }

    case 'types':
      console.log(JSON.stringify(TYPE_MAP, null, 2));
      return;

    case 'stats': {
      await runtime.invoke('issue-spotter', { query: 'Was the dismissal unfair? Also breach of contract?' });
      await runtime.invoke('citation-validator', { proposal: 'See [R1].', rules: [{ id: 'R1' }] });
      console.log(JSON.stringify(runtime.stats(), null, 2));
      return;
    }

    default:
      usage();
  }
})().catch(e => { console.error('agents error:', e.message); process.exit(1); });
