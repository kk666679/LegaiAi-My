import type { SkillDefinition } from './definition.js';
import type { SkillInvocation } from './invocation.js';
export class SkillRegistry {
  private skills = new Map<string, SkillDefinition>();
  private invocations: SkillInvocation[] = [];
  register(skill: SkillDefinition): void { this.skills.set(skill.id, skill); }
  get(id: string): SkillDefinition | undefined { return this.skills.get(id); }
  list(): SkillDefinition[] { return Array.from(this.skills.values()); }
  remove(id: string): boolean { return this.skills.delete(id); }
  async invoke(skillId: string, agentId: string, input: Record<string, unknown>): Promise<SkillInvocation> {
    const skill = this.skills.get(skillId);
    const invocation: SkillInvocation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      skillId, agentId, input, status: 'pending',
      startedAt: new Date().toISOString(),
    };
    this.invocations.push(invocation);
    if (!skill) {
      invocation.status = 'failed';
      invocation.error = `unknown skill: ${skillId}`;
      invocation.completedAt = new Date().toISOString();
      return invocation;
    }
    invocation.status = 'running';
    try {
      invocation.output = skill.handler ? await skill.handler(input) : {};
      invocation.status = 'completed';
    } catch (e) {
      invocation.status = 'failed';
      invocation.error = (e as Error).message;
    }
    invocation.completedAt = new Date().toISOString();
    return invocation;
  }
  history(filter?: { skillId?: string; agentId?: string; status?: SkillInvocation['status'] }): SkillInvocation[] {
    return this.invocations.filter((i) => {
      if (filter?.skillId && i.skillId !== filter.skillId) return false;
      if (filter?.agentId && i.agentId !== filter.agentId) return false;
      if (filter?.status && i.status !== filter.status) return false;
      return true;
    });
  }
}
