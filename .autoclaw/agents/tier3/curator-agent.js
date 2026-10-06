import { BaseAgent } from '../base-agent.js';
import { skillRegistry } from '../../skills/registry.js';
import { EvalHarness } from '../../eval/harness.js';

/**
 * agents/tier3/curator-agent.js — Tier 3: Curator agent for skill promotion.
 */
Object.defineProperty(exports, "__esModule", { value: true });

class CuratorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'curator-agent',
      role: 'curator',
      tier: 3,
      capabilities: ['skill.promote', 'skill.demote', 'skill.review'],
    });
    this.harness = new EvalHarness({ scorers: ['json-schema', 'llm-judge'], reporters: ['json'] });
  }

  async evaluateSkillForPromotion(skillName) {
    const skill = await skillRegistry.load(skillName);
    const goldenCases = await this.loadGoldenCases(skill);
    const summary = await this.harness.runSuite({
      name: `promotion-eval-${skillName}`,
      cases: goldenCases,
      target: skill,
      targetType: 'skill',
    });

    if (summary.avgScore >= 0.85 && summary.failed === 0) {
      return { verdict: 'promote', summary };
    }
    if (summary.avgScore < 0.5) {
      return { verdict: 'demote', summary };
    }
    return { verdict: 'hold', summary };
  }

  async loadGoldenCases(skill) {
    const fs = await import('fs/promises');
    const path = `${skill.dir}/${skill.evals}`;
    const lines = (await fs.readFile(path, 'utf8')).trim().split('\n');
    return lines.map((line) => JSON.parse(line));
  }
}

export { CuratorAgent as CuratorAgent };
