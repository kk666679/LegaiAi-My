#!/usr/bin/env node
"use strict";
/**
 * cli/eval.js — Eval CLI commands.
 */
const { EvalHarness } = require('../eval/harness');
const { agentRegistry } = require('../agents/registry');
const { skillRegistry } = require('../skills/registry');
const fs = require('fs/promises');

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'run': {
      const [targetType, targetName, suitePath] = process.argv.slice(3);
      const cases = (await fs.readFile(suitePath, 'utf8'))
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));

      let target;
      if (targetType === 'skill') {
        await skillRegistry.discover();
        target = await skillRegistry.load(targetName);
      } else if (targetType === 'agent') {
        const { registerAllAgents } = require('../agents/index');
        await registerAllAgents();
        target = agentRegistry.get(targetName);
      }

      if (!target) {
        console.error(`Target ${targetName} not found`);
        process.exit(1);
      }

      const harness = new EvalHarness({
        scorers: ['json-schema', 'tool-call', 'llm-judge'],
        reporters: ['console', 'json'],
      });

      const summary = await harness.runSuite({
        name: `${targetType}:${targetName}`,
        cases,
        target,
        targetType,
      });

      console.log(`\n${summary.passed}/${summary.total} passed (avg score: ${summary.avgScore.toFixed(2)})`);
      process.exit(summary.failed > 0 ? 1 : 0);
    }
    case 'leaderboard': {
      const { Leaderboard } = require('../eval/leaderboard');
      const lb = new Leaderboard({ path: '.autoclaw/eval/leaderboard.json' });
      await lb.load();
      console.table(lb.rankBy({ suite: process.argv[3] }));
      break;
    }
    default:
      console.log('Usage: autoclaw eval [run|leaderboard]');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });