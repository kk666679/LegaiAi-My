export interface SkillDefinition<I = Record<string, unknown>, O = Record<string, unknown>> {
  id: string; name: string; version: string; description?: string;
  inputs: Record<string, unknown>; outputs: Record<string, unknown>;
  requiredCapabilities: string[];
  handler?: (input: I) => Promise<O>;
}
