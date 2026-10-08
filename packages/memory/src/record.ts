export type MemoryType = 'working' | 'episodic' | 'semantic' | 'procedural' | 'user-project' | 'session';
export interface MemoryRecord {
  id: string; agentId: string; type: MemoryType; key: string;
  content: string; summary?: string; embedding?: number[];
  metadata: Record<string, unknown>; tenantId?: string; projectId?: string;
  confidence: number; createdAt: string; updatedAt: string;
  expiresAt?: string; provenance: string[];
}
