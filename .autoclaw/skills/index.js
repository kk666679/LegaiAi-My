'use strict';

/**
 * skills — envelope loader.
 *
 * Every folder under `skills/` that carries a `skill.json` is a skill. The
 * loader is read-only: it never writes to `skills/`, it only reports what the
 * envelopes declare. `validate()` is the gate the CLI and the test suite use.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

/** Every skill folder, sorted. Files (index.js, runner.js, README.md) are skipped. */
function listSkills() {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(ROOT, d.name, 'skill.json')))
    .map(d => d.name)
    .sort();
}

function readJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map((l, i) => {
      try { return JSON.parse(l); }
      catch (e) { throw new Error(`${p}:${i + 1} is not valid JSON — ${e.message}`); }
    });
}

/**
 * Load one skill envelope: skill.json + golden.jsonl + eval.json + the prose.
 * `skillMd` is '' when absent so callers can treat SKILL.md as optional.
 */
function loadSkill(name) {
  const dir = path.join(ROOT, name);
  const metaPath = path.join(dir, 'skill.json');
  if (!fs.existsSync(metaPath)) throw new Error(`Skill not found: ${name}`);
  let meta;
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); }
  catch (e) { throw new Error(`${name}: skill.json is not valid JSON — ${e.message}`); }

  const evalPath = path.join(dir, 'eval.json');
  const skillMdPath = path.join(dir, 'SKILL.md');
  const refPath = path.join(dir, 'reference.md');

  return {
    name,
    dir,
    meta,
    golden: readJsonl(path.join(dir, 'golden.jsonl')),
    eval: fs.existsSync(evalPath) ? JSON.parse(fs.readFileSync(evalPath, 'utf8')) : null,
    skillMd: fs.existsSync(skillMdPath) ? fs.readFileSync(skillMdPath, 'utf8') : '',
    reference: fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : ''
  };
}

function loadAll() { return listSkills().map(loadSkill); }

/** Contract checks across every envelope. Empty `problems` means consistent. */
function validate() {
  const problems = [];
  for (const name of listSkills()) {
    let s;
    try { s = loadSkill(name); }
    catch (e) { problems.push(`${name}: ${e.message}`); continue; }

    const m = s.meta;
    for (const req of ['id', 'version', 'kind', 'summary', 'inputs', 'outputs', 'triggers', 'tags']) {
      if (!m[req]) problems.push(`${name}: skill.json missing ${req}`);
    }
    if (m.id !== name) problems.push(`${name}: skill.json id "${m.id}" != folder "${name}"`);
    if (!Array.isArray(m.inputs) || !m.inputs.length) problems.push(`${name}: inputs must be a non-empty array`);
    if (!Array.isArray(m.outputs) || !m.outputs.length) problems.push(`${name}: outputs must be a non-empty array`);
    if (!Array.isArray(m.triggers) || !m.triggers.length) problems.push(`${name}: triggers must be a non-empty array`);
    if (!Array.isArray(m.tags) || !m.tags.length) problems.push(`${name}: tags must be a non-empty array`);
    if (!m.escalation || !Array.isArray(m.escalation.on) || !m.escalation.on.length) {
      problems.push(`${name}: escalation.on must be a non-empty array`);
    } else if (!m.escalation.via) {
      problems.push(`${name}: escalation.via must name a gate file`);
    }

    if (!s.golden.length) problems.push(`${name}: golden.jsonl empty`);
    if (s.eval && s.golden.length < (s.eval.minGolden || 1)) {
      problems.push(`${name}: golden.jsonl has ${s.golden.length}, eval.minGolden=${s.eval.minGolden}`);
    }
    const seen = new Set();
    for (const g of s.golden) {
      if (!g.id) problems.push(`${name}: golden case missing id`);
      else if (seen.has(g.id)) problems.push(`${name}: duplicate golden case id "${g.id}"`);
      else seen.add(g.id);
      if (!('input' in g)) problems.push(`${name}: golden case ${g.id} missing input`);
      if (!('expect' in g)) problems.push(`${name}: golden case ${g.id} missing expect`);
    }

    if (!s.eval) problems.push(`${name}: eval.json missing`);
    else if (!Array.isArray(s.eval.metrics) || !s.eval.metrics.length) problems.push(`${name}: eval.metrics must be a non-empty array`);
    if (!s.reference) problems.push(`${name}: reference.md missing`);
    if (!s.skillMd) problems.push(`${name}: SKILL.md missing`);
  }
  return { ok: problems.length === 0, problems };
}

function counts() {
  const out = {};
  for (const name of listSkills()) {
    const s = loadSkill(name);
    out[name] = {
      golden: s.golden.length,
      hasEval: !!s.eval,
      hasReference: !!s.reference,
      hasSkillMd: !!s.skillMd,
      kind: s.meta.kind,
      model: s.meta.model
    };
  }
  return out;
}

module.exports = { ROOT, listSkills, loadSkill, loadAll, validate, counts, readJsonl };