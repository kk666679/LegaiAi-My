/**
 * Central secret loading policy.
 *
 * Development keeps working with the historical fallbacks so the sandbox boots
 * without configuration. Production fails closed: a missing, placeholder, or
 * too-short secret throws at first use rather than silently degrading to a
 * value that is public in this repository.
 */

const PLACEHOLDER_SECRETS = new Set([
  'change-me-in-production',
  'change-me-at-least-32-random-characters-long',
  'changeme',
  'change-me',
  'secret',
  'password',
  'test',
])

export const PRODUCTION_SECRET_MIN_LENGTH = 32

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export interface RequireSecretOptions {
  /** Only honoured outside production. Keeps local dev and the test sandbox bootable. */
  devFallback?: string
  /** Minimum accepted length in production. Defaults to PRODUCTION_SECRET_MIN_LENGTH. */
  minLength?: number
}

export function requireSecret(name: string, options: RequireSecretOptions = {}): string {
  const value = (process.env[name] ?? '').trim()

  if (value) {
    if (isProduction()) {
      if (PLACEHOLDER_SECRETS.has(value.toLowerCase()))
        throw new Error(`${name} is set to a placeholder value and cannot be used in production`)
      const minLength = options.minLength ?? PRODUCTION_SECRET_MIN_LENGTH
      if (value.length < minLength)
        throw new Error(`${name} must be at least ${minLength} characters in production`)
    }
    return value
  }

  if (isProduction())
    throw new Error(`${name} must be configured in production`)

  if (options.devFallback)
    return options.devFallback

  throw new Error(`${name} environment variable is required`)
}