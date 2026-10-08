export interface AgentContext { agentId: string; sessionId: string; tenantId?: string; userId?: string; }
export type AgentHandler = (ctx: AgentContext, input: string) => Promise<string>;
export interface AgentDefinition {
  id: string; name: string; description?: string; version: string;
  tools: string[]; handler: AgentHandler;
}
