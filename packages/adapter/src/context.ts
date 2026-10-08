export interface AdapterContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
  signal?: AbortSignal;
}
export interface AdapterResult<T> {
  ok: boolean;
  value?: T;
  error?: { code: string; message: string; retryable: boolean };
  latencyMs: number;
}
