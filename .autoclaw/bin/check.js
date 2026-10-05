#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./_util');

const problems = [];
const required = [
  'package.json','README.md','AGENT-ORIENTATION.md','agent-style.md',
  'safety/mode',
  'orchestrator/board.json','orchestrator/board.md',
  'orchestrator/comms/loop-state.json',
  'orchestrator/comms/registry.json',
  'kg/schema.sql','kg/init.js',
  'spine/schema.sql','spine/init.js',
  'vector/schema.sql','vector/init.js',
  // Orchestrator paths required by .clinerules/orchestrate.md
  'orchestrator/config.yaml','orchestrator/state.json',
  'orchestrator/manifests','orchestrator/sprints',
  'orchestrator/reviews','orchestrator/logs',
  'orchestrator/comms/heartbeats'
];
for (const rel of required) {
  if (!fs.existsSync(path.join(ROOT, rel))) problems.push(`missing: ${rel}`);
}

// Every agent in the registry must resolve a keepalive template, otherwise
// `revive` errors with "no template registered for <agent-id>" (spec revive.2).
try {
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'orchestrator/comms/registry.json'), 'utf8')
  );
  for (const [id, a] of Object.entries(registry.agents || {})) {
    if (!a.keepalive_template) {
      problems.push(`registry: agent "${id}" has no keepalive_template (revive will fail)`);
      continue;
    }
    const abs = path.join(ROOT, 'skills/orchestrate', a.keepalive_template);
    if (!fs.existsSync(abs)) {
      problems.push(`registry: agent "${id}" keepalive_template not found: ${a.keepalive_template}`);
    }
  }
} catch (e) {
  problems.push(`registry.json unreadable: ${e.message}`);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (entry.name.endsWith('.json')) {
      try { JSON.parse(fs.readFileSync(full, 'utf8')); }
      catch (e) { problems.push(`bad JSON: ${path.relative(ROOT, full)} -> ${e.message}`); }
    }
    if (entry.name.endsWith('.jsonl')) {
      const raw = fs.readFileSync(full, 'utf8').split('\n');
      raw.forEach((l, i) => {
        if (!l.trim()) return;
        try { JSON.parse(l); }
        catch (e) { problems.push(`bad JSONL: ${path.relative(ROOT, full)}:${i + 1} -> ${e.message}`); }
      });
    }
  }
}
walk(ROOT);

if (problems.length) {
  console.error('check FAILED:');
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('check OK —', required.length, 'required files present, all JSON/JSONL valid');
