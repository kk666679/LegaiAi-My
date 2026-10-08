export interface GatewayStatus {
  environment: string;
  api: 'ready' | 'starting' | 'unavailable';
  database: 'connected' | 'disconnected' | 'unknown';
  queue: 'connected' | 'disconnected' | 'unknown';
  providers: 'ready' | 'degraded' | 'unavailable' | 'unknown';
}
