/**
 * @lawmate/cli — gateway subcommand.
 */
import { VERSION, formatStartupBanner } from '@lawmate/gateway';

export function gatewayInfo(): void {
  void VERSION;
  const status = {
    environment: process.env['LAWMATE_ENV'] || 'development',
    api: 'ready' as const,
    database: 'unknown' as const,
    queue: 'unknown' as const,
    providers: 'unknown' as const,
  };
  process.stdout.write(formatStartupBanner(status));
  process.stdout.write('\n');
}