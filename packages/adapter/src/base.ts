import type { AdapterContext, AdapterResult } from './context.js';
export abstract class BaseAdapter {
  abstract readonly name: string;
  abstract readonly kind: string;
  protected healthy = true;
  async health(): Promise<boolean> { return this.healthy; }
  protected async run<T>(fn: () => Promise<T>, _ctx: AdapterContext): Promise<AdapterResult<T>> {
    const start = Date.now();
    try {
      const value = await fn();
      return { ok: true, value, latencyMs: Date.now() - start };
    } catch (e) {
      this.healthy = false;
      const err = e as Error;
      return { ok: false, error: { code: 'adapter_error', message: err.message, retryable: true }, latencyMs: Date.now() - start };
    }
  }
}
