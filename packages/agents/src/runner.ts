import type { AgentContext } from './definition.js';
import type { AgentStep } from './step.js';
import type { AgentRegistry } from './registry.js';
export class AgentRunner {
  constructor(private readonly registry: AgentRegistry) {}
  async run(agentId: string, ctx: AgentContext, input: string): Promise<{ answer: string; steps: AgentStep[] }> {
    const agent = this.registry.get(agentId);
    if (!agent) throw new Error(`unknown agent: ${agentId}`);
    const steps: AgentStep[] = [];
    const step: AgentStep = { index: 0, startedAt: new Date().toISOString() };
    try {
      step.answer = await agent.handler(ctx, input);
      step.completedAt = new Date().toISOString();
      steps.push(step);
      return { answer: step.answer, steps };
    } catch (e) {
      step.error = (e as Error).message;
      step.completedAt = new Date().toISOString();
      steps.push(step);
      throw e;
    }
  }
}
