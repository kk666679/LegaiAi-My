/**
 * registry — the agent/model/skill catalogue.
 *
 * Declarative by default: every agent carries a skill, a model, declared
 * capabilities and an input schema, but NO implementation. Binding an
 * implementation is a separate, explicit step (`registerAgentImpl`) so a
 * catalog entry can never silently imply working code.
 *
 * This mirrors the platform's core safety rule — an unimplemented agent must
 * fail loudly, not degrade to a no-op that looks like success.
 */

/* ── Errors ───────────────────────────────────────────────────────────── */

class RegistryError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'RegistryError';
    this.code = code;
  }
}
class UnknownAgentError extends RegistryError {
  constructor(id) { super(`Unknown agent: ${id}`, 'UNKNOWN_AGENT'); this.name = 'UnknownAgentError'; this.id = id; }
}
class UnknownModelError extends RegistryError {
  constructor(id) { super(`Unknown model: ${id}`, 'UNKNOWN_MODEL'); this.name = 'UnknownModelError'; this.id = id; }
}
class UnknownSkillError extends RegistryError {
  constructor(id) { super(`Unknown skill: ${id}`, 'UNKNOWN_SKILL'); this.name = 'UnknownSkillError'; this.id = id; }
}
class DuplicateError extends RegistryError {
  constructor(what, id) { super(`Duplicate ${what}: ${id}`, 'DUPLICATE'); this.name = 'DuplicateError'; this.what = what; this.id = id; }
}
class NotImplementedError extends RegistryError {
  constructor(id) { super(`Agent "${id}" has no impl registered`, 'NOT_IMPLEMENTED'); this.name = 'NotImplementedError'; this.agentId = id; }
}
class SchemaError extends RegistryError {
  constructor(msg) { super(msg, 'SCHEMA'); this.name = 'SchemaError'; }
}

/* ── Models ───────────────────────────────────────────────────────────── */

/**
 * Data classes mirror the platform classification rules: `confidential` and
 * `privileged` material must not reach a non-local model.
 */
const MODELS = Object.freeze({
  'legal-reasoner-v1': Object.freeze({
    id: 'legal-reasoner-v1', role: 'reasoning', local: true, embed: false,
    maxDataClasses: ['public', 'internal', 'confidential']
  }),
  'legal-writer-v1': Object.freeze({
    id: 'legal-writer-v1', role: 'drafting', local: true, embed: false,
    maxDataClasses: ['public', 'internal']
  }),
  'llama3.1': Object.freeze({
    id: 'llama3.1', role: 'general', local: true, embed: false,
    maxDataClasses: ['public', 'internal', 'confidential']
  }),
  'embed-v1': Object.freeze({
    id: 'embed-v1', role: 'embedding', local: true, embed: true,
    maxDataClasses: ['public', 'internal', 'confidential', 'privileged']
  })
});

/* ── Skills ───────────────────────────────────────────────────────────── */

const SKILLS = Object.freeze([
  'legal-my',
  'legal-analyse',
  'legal-draft',
  'legal-retrieve',
  'legal-validate',
  'legal-audit',
  'legal-hitl',
  'legal-orchestrate',
  'legal-contract-law',
  'legal-civil-litigation',
  'legal-criminal-procedure',
  'legal-employment',
  'legal-family-law',
  'legal-company-law',
  'legal-cyber-law',
  'legal-tort-law',
  'legal-adr'
].map(id => Object.freeze({ id, source: 'openclaw-skills' })));

/* ── Agents ───────────────────────────────────────────────────────────── */

/**
 * `impl` is intentionally absent on every entry — bind with
 * `registerAgentImpl`. `hitlLevel` follows the platform scale where 0-1 is
 * autonomous and 2+ requires human approval.
 */
const AGENTS = Object.freeze([
  { id: 'issue-spotter',      skill: 'legal-analyse',           model: 'legal-reasoner-v1', role: 'analyst',   dataClass: 'confidential', hitlLevel: 0, capabilities: ['issue-framing', 'question-decomposition'] },
  { id: 'rule-finder',         skill: 'legal-retrieve',          model: 'legal-reasoner-v1', role: 'retriever', dataClass: 'confidential', hitlLevel: 0, capabilities: ['retrieval', 'statute-lookup', 'hybrid-search'] },
  { id: 'precedent-analyst',   skill: 'legal-civil-litigation',  model: 'legal-reasoner-v1', role: 'analyst',   dataClass: 'internal',    hitlLevel: 1, capabilities: ['precedent-analysis', 'case-comparison'] },
  { id: 'statute-interpreter', skill: 'legal-contract-law',      model: 'legal-reasoner-v1', role: 'analyst',   dataClass: 'internal',    hitlLevel: 1, capabilities: ['statutory-interpretation', 'provision-mapping'] },
  { id: 'citation-validator',  skill: 'legal-validate',          model: 'legal-reasoner-v1', role: 'validator', dataClass: 'internal',    hitlLevel: 1, capabilities: ['citation-verification', 'hallucination-detection'] },
  { id: 'drafter',             skill: 'legal-draft',             model: 'llama3.1',          role: 'writer',    dataClass: 'confidential', hitlLevel: 2, capabilities: ['document-drafting', 'irac-composition'] },
  { id: 'devil-advocate',      skill: 'legal-criminal-procedure', model: 'legal-reasoner-v1', role: 'analyst',  dataClass: 'internal',    hitlLevel: 1, capabilities: ['adversarial-argument', 'counter-argument'] },
  { id: 'risk-scorer',         skill: 'legal-tort-law',          model: 'legal-reasoner-v1', role: 'analyst',   dataClass: 'internal',    hitlLevel: 1, capabilities: ['risk-assessment', 'exposure-quantification'] },
  { id: 'summariser',          skill: 'legal-my',                model: 'llama3.1',          role: 'writer',    dataClass: 'internal',    hitlLevel: 1, capabilities: ['summarisation', 'plain-language'] },
  { id: 'translator-ms',       skill: 'legal-analyse',           model: 'llama3.1',          role: 'writer',    dataClass: 'internal',    hitlLevel: 1, capabilities: ['translation', 'en-ms'] },
  { id: 'qa-reviewer',         skill: 'legal-hitl',              model: 'legal-reasoner-v1', role: 'reviewer',  dataClass: 'confidential', hitlLevel: 2, capabilities: ['quality-review', 'hitl-gating'] }
].map(a => Object.freeze(a)));

/* ── Registry ─────────────────────────────────────────────────────────── */

function deepFreezeCatalog(catalog) {
  return Object.freeze({
    agents: Object.freeze([...catalog.agents]),
    models: Object.freeze({ ...catalog.models }),
    skills: Object.freeze([...catalog.skills])
  });
}

const DEFAULT_CATALOG = deepFreezeCatalog({ agents: AGENTS, models: MODELS, skills: SKILLS });

/** Minimal structural validation of a payload against a field spec. */
function validateShape(payload, schema) {
  if (!schema || typeof schema !== 'object') return [];
  const problems = [];
  for (const [field, rule] of Object.entries(schema)) {
    const v = payload ? payload[field] : undefined;
    const missing = v === undefined || v === null || v === '';
    if (missing && rule.required) problems.push(`missing required field "${field}"`);
    else if (!missing && rule.type && typeof v !== rule.type) {
      problems.push(`field "${field}" expected ${rule.type}, got ${typeof v}`);
    }
  }
  return problems;
}

/** Handle returned by getAgent(): wraps the bound impl with schema + errors. */
class AgentHandle {
  constructor(registry, def) {
    this.registry = registry;
    this.def = def;
    this.id = def.id;
    this.skill = def.skill;
    this.model = def.model;
    this.role = def.role;
  }

  get implemented() {
    return typeof this.registry._impls.get(this.id) === 'function';
  }

  async invoke(input = {}) {
    const impl = this.registry._impls.get(this.id);
    if (typeof impl !== 'function') throw new NotImplementedError(this.id);
    const problems = validateShape(input, this.def.inputSchema);
    if (problems.length) throw new SchemaError(`agent "${this.id}": ${problems.join('; ')}`);
    return impl(input, this.def);
  }
}

class Registry {
  /**
   * @param {object} opts
   * @param {object} opts.catalog  override the default catalogue
   * @param {boolean} opts.strict unknown ids throw (default) vs return null
   */
  constructor({ catalog = DEFAULT_CATALOG, strict = true } = {}) {
    this.catalog = catalog;
    this.strict = strict !== false;
    this._impls = new Map();

    this._agents = new Map();
    for (const a of catalog.agents) this._agents.set(a.id, a);
    this._models = new Map();
    for (const [id, m] of Object.entries(catalog.models)) this._models.set(id, m);
    this._skills = new Map();
    for (const s of catalog.skills) this._skills.set(s.id, s);
  }

  /* ── lookups ─────────────────────────────────────────────────────── */

  getAgent(id) {
    const def = this._agents.get(id);
    if (!def) {
      if (this.strict) throw new UnknownAgentError(id);
      return null;
    }
    return new AgentHandle(this, def);
  }

  getModel(id) {
    const m = this._models.get(id);
    if (!m) {
      if (this.strict) throw new UnknownModelError(id);
      return null;
    }
    return m;
  }

  getSkill(id) {
    const s = this._skills.get(id);
    if (!s) {
      if (this.strict) throw new UnknownSkillError(id);
      return null;
    }
    return s;
  }

  agents() { return [...this._agents.values()]; }
  models() { return [...this._models.values()]; }
  skills() { return [...this._skills.values()]; }

  /* `list*` aliases — the MCP resource/tool layer reads these names. */
  listAgents() { return this.agents(); }
  listModels() { return this.models(); }
  listSkills() { return this.skills(); }

  /* ── implementation binding ─────────────────────────────────────── */

  /** True when an impl is already bound for this agent. */
  hasAgentImpl(id) {
    return this._impls.has(id);
  }

  registerAgentImpl(id, fn) {
    if (typeof fn !== 'function') throw new TypeError(`impl for "${id}" must be a function`);
    if (!this._agents.has(id)) throw new UnknownAgentError(id);
    if (this._impls.has(id)) throw new DuplicateError('agent impl', id);
    this._impls.set(id, fn);
    return this;
  }

  registerAgentImpls(map) {
    for (const [id, fn] of Object.entries(map || {})) this.registerAgentImpl(id, fn);
    return this;
  }

  /* ── reporting ──────────────────────────────────────────────────── */

  snapshot() {
    return {
      counts: {
        agents: this._agents.size,
        models: this._models.size,
        skills: this._skills.size,
        implemented: this._impls.size
      },
      agents: this.agents(),
      models: this.models(),
      skills: this.skills()
    };
  }

  /**
   * Cross-reference every agent against the model and skill tables and against
   * the data-classification rules. Returns a list of human-readable problems;
   * empty means the catalogue is internally consistent.
   */
  integrity() {
    const problems = [];
    for (const a of this._agents.values()) {
      if (!this._models.has(a.model)) problems.push(`agent "${a.id}": unknown model "${a.model}"`);
      if (!this._skills.has(a.skill)) problems.push(`agent "${a.id}": unknown skill "${a.skill}"`);
      if (!Array.isArray(a.capabilities) || a.capabilities.length === 0) {
        problems.push(`agent "${a.id}": no capabilities declared`);
      }
      const model = this._models.get(a.model);
      if (model && a.dataClass && !model.maxDataClasses.includes(a.dataClass)) {
        problems.push(`agent "${a.id}": model "${a.model}" is not permitted for data class "${a.dataClass}"`);
      }
    }
    const seen = new Set();
    for (const a of this._agents.values()) {
      if (seen.has(a.id)) problems.push(`duplicate agent id "${a.id}"`);
      seen.add(a.id);
    }
    return problems;
  }
}

/** Process-wide default registry. */
const defaultRegistry = new Registry();

;

export { Registry, AgentHandle, defaultRegistry, DEFAULT_CATALOG, MODELS, SKILLS, AGENTS, RegistryError, UnknownAgentError, UnknownModelError, UnknownSkillError, DuplicateError, NotImplementedError, SchemaError, validateShape };
