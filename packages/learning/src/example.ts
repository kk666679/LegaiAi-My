export interface LearningExample {
  id: string; source: string;
  input: Record<string, unknown>;
  expectedOutput?: Record<string, unknown>;
  outcome?: string; feedback?: string;
  collectedAt: string; metadata: Record<string, unknown>;
}
