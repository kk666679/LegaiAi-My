import { healthCommand } from './health.js';
import { agentsCommand } from './agents.js';
import { skillsCommand } from './skills.js';
import { evalCommand } from './eval.js';
import { harnessCommand } from './harness.js';
import { memoryCommand } from './memory.js';
import { mcpCommand } from './mcp.js';
import { workflowCommand } from './workflow.js';
import { fleetCommand } from './fleet.js';
import { budgetCommand } from './budget.js';
import { cloudCommand } from './cloud.js';
import { commsCommand } from './comms.js';
import { daemonCommand } from './daemon.js';
import { kgCommand } from './kg.js';
import { vectorCommand } from './vector.js';

export async function loadCommands() {
  return {
    health: healthCommand,
    agents: agentsCommand,
    skills: skillsCommand,
    eval: evalCommand,
    harness: harnessCommand,
    memory: memoryCommand,
    mcp: mcpCommand,
    workflow: workflowCommand,
    fleet: fleetCommand,
    budget: budgetCommand,
    cloud: cloudCommand,
    comms: commsCommand,
    daemon: daemonCommand,
    kg: kgCommand,
    vector: vectorCommand,
  };
}
