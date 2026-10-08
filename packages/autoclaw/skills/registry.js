import * as envelopes from './index.js';

const discovered = new Map();

async function discover() {
  for (const name of envelopes.listSkills()) {
    if (!discovered.has(name)) discovered.set(name, envelopes.loadSkill(name));
  }
  return [...discovered.keys()];
}

function list() {
  return [...discovered.keys()];
}

async function load(name) {
  if (!discovered.has(name)) {
    if (!envelopes.listSkills().includes(name)) {
      throw new Error(`Skill not found: ${name}`);
    }
    discovered.set(name, envelopes.loadSkill(name));
  }
  const env = discovered.get(name);
  return {
    name: env.name,
    version: env.meta.version,
    kind: env.meta.kind,
    dir: env.dir,
    meta: env.meta,
    golden: env.golden,
    eval: env.eval,
    evals: 'golden.jsonl',
    skillMd: env.skillMd,
    reference: env.reference,
    canApply({ goal, context } = {}) {
      const triggers = env.meta.triggers || [];
      const text = `${goal || ''} ${context && context.text ? context.text : ''}`.toLowerCase();
      return triggers.some((t) => text.includes(String(t).toLowerCase()));
    },
    async invoke(input, runtime = {}) {
      return {
        status: 'skipped',
        skill: env.name,
        input,
        reason: 'no implementation wired',
      };
    },
  };
}

export const skillRegistry = { discover, list, load };
