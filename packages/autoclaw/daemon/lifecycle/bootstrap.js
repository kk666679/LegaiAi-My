import { Comms } from '../../comms/index.js';
import { BudgetEnforcer } from '../../budget/index.js';

export async function bootstrap({ config }) {
  const components = {};

  try {
    // 1. Initialize Comms layer
    components.comms = new Comms({
      roomsDir: `${config.workspaceRoot}/.autoclaw/orchestrator/comms`,
    });
    await components.comms.start();
    console.log('[daemon] ✓ Comms initialized');

    // 2. Initialize Budget enforcer
    components.budget = new BudgetEnforcer({
      config: {
        perRun: 1.0,
        perAgentDay: 50.0,
        globalDay: 500.0,
      },
    });
    console.log('[daemon] ✓ Budget enforcer initialized');

    // 3. Initialize agent registry
    components.agents = { list: async () => [] };
    console.log('[daemon] ✓ Agent registry initialized');

    // 4. Initialize orchestrator
    components.orchestrator = {
      health: async () => ({ ok: true }),
      stop: async () => {},
    };
    console.log('[daemon] ✓ Orchestrator initialized');

    return components;
  } catch (error) {
    console.error('[daemon] Bootstrap failed:', error);
    // Clean up partial initialization
    for (const [name, component] of Object.entries(components)) {
      try {
        if (component.stop) {
          await component.stop();
        }
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

export async function bootstrapInOrder(config) {
  const startup = [
    {
      name: 'comms',
      init: async () => {
        const comms = new Comms();
        await comms.start();
        return comms;
      },
    },
    {
      name: 'budget',
      init: async () => new BudgetEnforcer({ config: {} }),
    },
    {
      name: 'agents',
      init: async () => ({ list: async () => [] }),
    },
  ];

  const components = {};
  for (const item of startup) {
    try {
      components[item.name] = await item.init();
      console.log(`[daemon] ✓ ${item.name} started`);
    } catch (error) {
      console.error(`[daemon] ✗ ${item.name} failed:`, error.message);
      throw error;
    }
  }

  return components;
}
