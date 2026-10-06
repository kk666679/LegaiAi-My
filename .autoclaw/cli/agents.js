#!/usr/bin/env node
import { agentRegistry } from '../agents/registry.js';

import { registerAllAgents } from '../agents/index.js';
import { registerAllAgents } from '../agents/index.js';
import { registerAllAgents } from '../agents/index.js;

"use strict";
/**
 * cli/agents.js — Agent CLI commands.
 */

async function main() {
  const command = process.argv[2]';

  switch (command) {
    case 'list': {

      await registerAllAgents();
      console.table(agentRegistry.list().map((a) => ({
        id: a.id,
        role: a.role,
        tier: a.tier,
        capabilities: a.capabilities.join(', '),
      })));
      break;
    }
    case 'run': {
      const [agentId, goal] = process.argv.slice(3);

      await registerAllAgents();
      const agent = agentRegistry.get(agentId);
      if (!agent) {
        console.error(`Agent ${agentId} not found`);
        process.exit(1);
      }
      const result = await agent.run(goal, {});
      console.log(JSON.stringify(result, null, 2));
      break;
    }
    case 'stats': {

      await registerAllAgents();
      console.log(agentRegistry.stats());
      break;
    }
    default:
      console.log('Usage: autoclaw agents [list|run|stats]');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
