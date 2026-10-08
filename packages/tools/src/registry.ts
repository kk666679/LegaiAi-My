import type { ToolDefinition } from './definition.js';
import type { ToolInvocation } from './invocation.js';
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition<never, unknown>>();
  private invocations: ToolInvocation[] = [];
  register<I, O>(tool: ToolDefinition<I, O>): void {
    this.tools.set(tool.id, tool as unknown as ToolDefinition<never, unknown>);
  }
  get(id: string): ToolDefinition<never, unknown> | undefined { return this.tools.get(id); }
  list(): ToolDefinition<never, unknown>[] { return Array.from(this.tools.values()); }
  remove(id: string): boolean { return this.tools.delete(id); }
  async invoke<I, O>(toolId: string, input: I): Promise<ToolInvocation> {
    const tool = this.tools.get(toolId) as ToolDefinition<I, O> | undefined;
    const invocation: ToolInvocation = {
      id: `ti_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      toolId, input, status: 'pending',
      startedAt: new Date().toISOString(),
    };
    this.invocations.push(invocation);
    if (!tool) {
      invocation.status = 'failed';
      invocation.error = `unknown tool: ${toolId}`;
      invocation.completedAt = new Date().toISOString();
      return invocation;
    }
    invocation.status = 'running';
    const start = Date.now();
    try {
      const run = tool.handler ? tool.handler(input) : Promise.resolve({} as O);
      const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), tool.timeoutMs));
      invocation.output = await Promise.race([run, timeout]);
      invocation.status = 'completed';
    } catch (e) {
      const err = e as Error;
      invocation.status = err.message === 'timeout' ? 'timeout' : 'failed';
      invocation.error = err.message;
    }
    invocation.durationMs = Date.now() - start;
    invocation.completedAt = new Date().toISOString();
    return invocation;
  }
  history(filter?: { toolId?: string; status?: ToolInvocation['status'] }): ToolInvocation[] {
    return this.invocations.filter((i) => {
      if (filter?.toolId && i.toolId !== filter.toolId) return false;
      if (filter?.status && i.status !== filter.status) return false;
      return true;
    });
  }
}
