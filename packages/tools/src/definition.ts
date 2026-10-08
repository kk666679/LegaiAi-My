export interface ToolDefinition<I = unknown, O = unknown> {
  id: string; name: string; version: string; description?: string;
  inputSchema: Record<string, unknown>; outputSchema: Record<string, unknown>;
  permissions: string[]; risk: 'low' | 'medium' | 'high' | 'critical';
  timeoutMs: number; idempotent: boolean;
  handler?: (input: I) => Promise<O>;
}
