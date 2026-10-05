let Agent;
try {
  const agentsMod = await import('../agents/base-agent.js');
  Agent = agentsMod.Agent;
} catch {}

let TieredRouter;
try {
  const routingMod = await import('../routing/tiered-router.js');
  TieredRouter = routingMod.TieredRouter;
} catch {}

let CheckpointStore;
try {
  const checkpointMod = await import('./checkpoint.js');
  CheckpointStore = checkpointMod.CheckpointStore;
} catch {}

let BuildContext;
try {
  const contextMod = await import('./context-manager.js');
  BuildContext = contextMod.BuildContext;
} catch {}

/**
 * BuildHarness — wraps the autobuild loop with lifecycle controls.
 * Implements the Agent = Model + Harness pattern.
 */
export class BuildHarness {
  constructor({ agent, router, checkpoint, context, config = {} } = {}) {
    this.agent = agent;
    this.router = router;
    this.checkpoint = checkpoint;
    this.context = context;
    this.config = {
      maxTurns: config.maxTurns ?? 50,
      tokenBudget: config.tokenBudget ?? 200000,
      costCeiling: config.costCeiling ?? 5.00,
      stallTimeoutMs: config.stallTimeoutMs ?? 300000,
    };
  }

  async run(goal, opts = {}) {
    const runId = crypto.randomUUID();
    let state = await this.checkpoint.load(runId) || this.initialState(goal);
    const startTime = Date.now();

    try {
      while (state.turn < this.config.maxTurns) {
        // 1. Check stall
        if (Date.now() - state.lastProgressAt > this.config.stallTimeoutMs) {
          state = await this.recoverFromStall(state);
          continue;
        }

        // 2. Check budget
        if (state.tokensUsed >= this.config.tokenBudget) {
          throw new BudgetExceeded(`Token budget exhausted at turn ${state.turn}`);
        }
        if (state.costUsed >= this.config.costCeiling) {
          throw new CostCeilingExceeded(`Cost ceiling reached: $${state.costUsed}`);
        }

        // 3. Assemble context (L1 skills + L2 bodies + memory)
        const assembledContext = await this.context.assemble(state, goal);

        // 4. Route to model (tiered: deterministic → small → primary)
        const route = await this.router.route({
          task: state.currentTask,
          context: assembledContext,
          budget: this.config.tokenBudget - state.tokensUsed,
        });

        // 5. Execute turn
        const result = await route.invoke(assembledContext);

        // 6. Update state
        state.turn++;
        state.tokensUsed += result.tokensUsed || 0;
        state.costUsed += result.cost || 0;
        state.lastProgressAt = Date.now();
        state.history.push({ turn: state.turn, result });

        // 7. Checkpoint every turn
        await this.checkpoint.save(runId, state);

        // 8. Check termination
        if (result.isTerminal) break;
      }

      return this.finalize(state, { runId, durationMs: Date.now() - startTime });
    } catch (error) {
      await this.checkpoint.save(runId, { ...state, error: error.message, status: 'failed' });
      throw error;
    }
  }

  initialState(goal) {
    return {
      goal,
      turn: 0,
      tokensUsed: 0,
      costUsed: 0,
      history: [],
      currentTask: goal,
      status: 'running',
      startedAt: Date.now(),
      lastProgressAt: Date.now(),
    };
  }

  async recoverFromStall(state) {
    state.history.push({ turn: state.turn, event: 'stall_recovery' });
    state.currentTask = await this.context.recoverTask(state);
    state.lastProgressAt = Date.now();
    return state;
  }

  finalize(state, meta) {
    return { ...state, status: 'complete', ...meta };
  }
}

class BudgetExceeded extends Error {
  constructor(message) {
    super(message);
    this.name = 'BudgetExceeded';
  }
}

class CostCeilingExceeded extends Error {
  constructor(message) {
    super(message);
    this.name = 'CostCeilingExceeded';
  }
}

export { BudgetExceeded, CostCeilingExceeded };