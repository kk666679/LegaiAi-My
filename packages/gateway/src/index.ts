/**
 * @lawmate/gateway — Public API.
 */
export type { GatewayStatus } from './status.js';
export { VERSION, formatStartupBanner, writeStartupBanner } from './banner.js';
export { GatewayServer, type GatewayOptions } from './server.js';