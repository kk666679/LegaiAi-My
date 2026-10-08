export interface ConsolidatableRecord {
  id: string; agentId: string; type: string; content: string;
  confidence: number; createdAt: string; updatedAt: string;
}
export interface ConsolidationResult {
  mergedIds: string[]; summary: string; confidence: number; promoted: boolean;
}
