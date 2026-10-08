import { pickBanner } from '@lawmate/branding';
import type { GatewayStatus } from './status.js';
export const VERSION = '1.0.0';
export function formatStartupBanner(status: GatewayStatus): string {
  return [
    pickBanner('gateway'), '',
    'LAWMATE AI API GATEWAY', 'Unified AI Infrastructure', '',
    `Environment: ${status.environment}`,
    `API:         ${status.api}`,
    `Database:    ${status.database}`,
    `Queue:       ${status.queue}`,
    `Providers:   ${status.providers}`, '',
  ].join('\n');
}
export function writeStartupBanner(status: GatewayStatus): void {
  process.stdout.write(formatStartupBanner(status));
}
