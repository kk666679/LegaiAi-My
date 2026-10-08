export type RegistryKind =
  | 'agent' | 'skill' | 'tool' | 'model' | 'provider'
  | 'dataset' | 'evaluator' | 'policy' | 'connector'
  | 'workflow' | 'plugin' | 'adapter';
export interface RegistryEntry {
  id: string; name: string; kind: RegistryKind; version: string;
  description?: string; capabilities?: string[]; dependencies?: string[];
  tags?: string[]; status?: 'active' | 'deprecated' | 'disabled' | 'revoked';
  publisher?: string; metadata?: Record<string, unknown>;
}
