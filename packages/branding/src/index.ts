/**
 * @lawmate/branding — public entry point.
 */
import {
  LAWMATE_BANNER,
  LAWMATE_BANNER_COMPACT,
  LAWMATE_BANNER_WIDTH,
  getBanner,
  type BannerProduct,
  type BannerOptions,
} from './figlet.js';

export {
  LAWMATE_BANNER,
  LAWMATE_BANNER_COMPACT,
  LAWMATE_BANNER_WIDTH,
  getBanner,
  type BannerProduct,
  type BannerOptions,
};

export function supportsUnicode(
  env: NodeJS.ProcessEnv = process.env,
  isTTY: boolean = Boolean(process.stdout?.isTTY)
): boolean {
  if (!isTTY) return false;
  if (env['CI']) return false;
  if (env['TERM'] === 'dumb') return false;
  if (process.platform === 'win32' && !env['WT_SESSION']) return false;
  return true;
}

export function supportsWideBanner(
  env: NodeJS.ProcessEnv = process.env,
  columns: number = process.stdout?.columns ?? 0
): boolean {
  if (env['CI']) return false;
  return columns >= LAWMATE_BANNER_WIDTH + 2;
}

export function isBannerSuppressed(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const v = env['LAWMATE_NO_BANNER'];
  return Boolean(v && v !== '0' && v.toLowerCase() !== 'false');
}

export function pickBanner(
  product: BannerProduct,
  explicitCompact?: boolean
): string {
  if (isBannerSuppressed()) return '';
  const compact =
    explicitCompact ?? (!supportsUnicode() || !supportsWideBanner());
  return getBanner({ product, compact });
}