import { existsSync, readFileSync } from "fs";
import { join } from "path";

let skillsLoader = null;
let memory = null;

try {
  const skillsMod = await import('../skills/loader.js');
  skillsLoader = skillsMod.skillsLoader;
} catch {}

try {
  const memoryMod = await import('../memory/index.js');
  memory = memoryMod.memory;
} catch {}

/**
 * BuildContext — assembles L1 skills, L2 bodies, and memory for model context.
 */
class BuildContext {
  constructor({ skillProgressiveLoader = skillsLoader, memoryCache = memory } = {}) {
    this.skillLoader = skillProgressiveLoader;
    this.memory = memoryCache;
  }

  async assemble(state, goal) {
    let l1Skills = {};
    if (this.skillLoader && this.skillLoader.loadLevel) {
      l1Skills = await this.skillLoader.loadLevel('L1');
    }

    let l2Bodies = {};
    if (state.turn > 5 && this.skillLoader && this.skillLoader.loadLevel) {
      l2Bodies = await this.skillLoader.loadLevel('L2');
    }

    let memoryTraces = [];
    if (this.memory && this.memory.retrieve) {
      memoryTraces = await this.memory.retrieve({
        query: goal,
        limit: 10,
        minScore: 0.7,
      });
    }

    return {
      goal,
      turn: state.turn,
      tokensUsed: state.tokensUsed,
      costUsed: state.costUsed,
      l1Skills,
      l2Bodies,
      memory: memoryTraces,
      history: state.history.slice(-5),
    };
  }

  async recoverTask(state) {
    const recentHistory = state.history.slice(-3);
    const summary = recentHistory
      .map((h) => `Turn ${h.turn}: ${JSON.stringify(h.result)}`)
      .join('\n');

    return {
      ...state.currentTask,
      recoveryContext: {
        stallAt: state.turn,
        recentHistory: summary,
        suggestion: 'Re-frame task with more specific sub-goals',
      },
    };
  }
}

export { BuildContext };