#!/usr/bin/env node
"use strict";
/**
 * cli/skills.js — Skill CLI commands.
 */
const { skillRegistry } = require('../skills/registry');

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'list': {
      await skillRegistry.discover();
      console.table(skillRegistry.list());
      break;
    }
    case 'validate': {
      const [name] = process.argv.slice(3);
      await skillRegistry.discover();
      const skill = await skillRegistry.load(name);
      console.log(`✓ ${skill.name}@${skill.version} is valid`);
      break;
    }
    case 'run': {
      const [name, inputJson] = process.argv.slice(3);
      await skillRegistry.discover();
      const skill = await skillRegistry.load(name);
      const input = JSON.parse(inputJson);
      const result = await skill.invoke(input, {});
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    default:
      console.log('Usage: autoclaw skills [list|validate|run]');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });