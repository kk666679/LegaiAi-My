export interface KgNode {
  id: string; type: string; label: string;
  data: Record<string, unknown>; createdAt: string;
}
export interface KgEdge {
  id: string; from: string; to: string; relation: string;
  weight: number; data?: Record<string, unknown>; createdAt: string;
}
