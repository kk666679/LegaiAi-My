import type { MemoryType } from './record.js';
export interface RecallQuery {
  agentId: string; type?: MemoryType; key?: string; query?: string;
  tenantId?: string; projectId?: string; limit?: number; minConfidence?: number;
}
