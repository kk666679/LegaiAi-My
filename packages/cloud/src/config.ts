export interface CloudConfig { endpoint: string; hmacSecret: string; timeoutMs?: number; }
export interface CloudRequest { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; body?: unknown; }
export interface CloudResponse<T = unknown> { ok: boolean; status: number; body?: T; error?: string; }
