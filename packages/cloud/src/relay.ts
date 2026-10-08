import { createHmac } from 'node:crypto';
import type { CloudConfig, CloudRequest, CloudResponse } from './config.js';
export class CloudRelay {
  constructor(private readonly config: CloudConfig) {}
  private sign(payload: string): string {
    return createHmac('sha256', this.config.hmacSecret).update(payload).digest('hex');
  }
  async send<T = unknown>(req: CloudRequest): Promise<CloudResponse<T>> {
    const url = this.config.endpoint.replace(/\/$/, '') + req.path;
    const body = req.body === undefined ? '' : JSON.stringify(req.body);
    const signature = this.sign(`${req.method}\n${req.path}\n${body}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30_000);
    try {
      const res = await fetch(url, {
        method: req.method,
        headers: { 'content-type': 'application/json', 'x-lawmate-signature': signature },
        body: body || undefined,
        signal: controller.signal,
      }) as Response;
      const parsed = (await res.json().catch(() => undefined)) as T | undefined;
      return { ok: res.ok, status: res.status, body: parsed };
    } catch (e) { return { ok: false, status: 0, error: (e as Error).message }; }
    finally { clearTimeout(timeout); }
  }
}
