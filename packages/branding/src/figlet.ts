/**
 * @lawmate/branding — the official LAWMATE FIGlet banner.
 *
 * Store as a constant. Do NOT regenerate at runtime with a FIGlet library;
 * the artwork below is approved and must remain visually identical.
 */

export const LAWMATE_BANNER = `██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY`;

export const LAWMATE_BANNER_COMPACT = `LAWMATE
MCP • CLI • AI API GATEWAY`;

export const LAWMATE_BANNER_WIDTH = 64;

export type BannerProduct = 'mcp' | 'cli' | 'gateway';

const PRODUCT_LINES: Record<BannerProduct, [string, string]> = {
  mcp: ['LAWMATE MCP', 'Model Context Protocol'],
  cli: ['LAWMATE CLI', 'Developer Command Line'],
  gateway: ['LAWMATE AI API GATEWAY', 'Unified AI Infrastructure'],
};

export interface BannerOptions {
  product: BannerProduct;
  compact?: boolean;
  silent?: boolean;
}

export function getBanner(opts: BannerOptions): string {
  if (opts.silent) return '';
  const [title, subtitle] = PRODUCT_LINES[opts.product];
  const art = opts.compact ? LAWMATE_BANNER_COMPACT : LAWMATE_BANNER;
  return `${art}\n\n${title}\n${subtitle}`;
}
