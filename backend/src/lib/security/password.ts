import { createHmac, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'crypto'
import { promisify } from 'util'
import { requireSecret } from './secrets'

// Password storage: scrypt (memory-hard, in Node core) rather than a bare
// HMAC. A keyed hash is a MAC construction, not a password KDF — it is cheap
// by design, so a leaked user table is brute-forceable at GPU speed.
//
// scrypt cost is encoded in the stored string so parameters can be raised
// later without invalidating existing hashes.
const SCRYPT_PREFIX = 'scrypt$'
const SCRYPT_PARAMS = { N: 1 << 16, r: 8, p: 1, keylen: 64 }
const SCRYPT_MAXMEM = 128 * SCRYPT_PARAMS.N * SCRYPT_PARAMS.r * 2

// Hard ceiling on memory any single verification may request. Stored cost
// parameters come from the database, so they must never be able to make the
// process allocate without bound. Sized to allow a further ~2x cost increase
// over SCRYPT_PARAMS; anything beyond that is rejected, not clamped.
//
// OpenSSL also requires 128*p + 256*r + 2048 bytes of headroom on top of
// 128*N*r. Without it in the ceiling, the most expensive *accepted* cost would
// sit just above what scrypt allows and every such hash would fail to verify.
const SCRYPT_MAX_N = 1 << 17
const SCRYPT_MAX_R = 16
const SCRYPT_MAX_P = 16
const SCRYPT_MAXMEM_CEILING =
  128 * SCRYPT_MAX_N * SCRYPT_MAX_R + 128 * SCRYPT_MAX_P + 256 * SCRYPT_MAX_R + 2048
const SCRYPT_MAX_COST = SCRYPT_MAXMEM_CEILING / 128

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>

/**
 * Legacy pre-scrypt secret. Only HMAC-SHA256 with it, and only so existing
 * accounts can still sign in once and get transparently rehashed.
 */
function legacySecret(): string {
  return requireSecret('SESSION_SECRET', { devFallback: 'change-me-in-production' })
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function deriveScrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  params: { N: number; r: number; p: number },
): Promise<Buffer> {
  return scryptAsync(password, salt, keylen, {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: Math.min(
      Math.max(SCRYPT_MAXMEM, 128 * params.N * params.r + 128 * params.p + 256 * params.r + 2048),
      SCRYPT_MAXMEM_CEILING,
    ),
  })
}

/**
 * Burns one full derivation on a terminal path. Used so that every outcome of
 * verifyPassword costs the same: a legacy or unparseable stored value is
 * otherwise answered in microseconds while an unknown email takes a full
 * scrypt, which is a remote account-enumeration oracle.
 */
async function burnDerivation(password: string): Promise<void> {
  try {
    await deriveScrypt(password.normalize('NFKC'), randomBytes(16), SCRYPT_PARAMS.keylen, SCRYPT_PARAMS)
  } catch {
    // Never let the decoy itself fail the login.
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = await deriveScrypt(password.normalize('NFKC'), salt, SCRYPT_PARAMS.keylen, SCRYPT_PARAMS)
  return `${SCRYPT_PREFIX}${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt.toString('hex')}$${derived.toString('hex')}`
}

interface ParsedScrypt {
  N: number
  r: number
  p: number
  salt: Buffer
  hash: Buffer
}

function parseScrypt(stored: string): ParsedScrypt | null {
  const parts = stored.split('$')
  if (parts.length !== 6 || `${parts[0]}$` !== SCRYPT_PREFIX) return null
  const N = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  const salt = Buffer.from(parts[4] ?? '', 'hex')
  const hash = Buffer.from(parts[5] ?? '', 'hex')
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return null
  // Reject hostile or corrupt parameters before handing them to scrypt. Bounds
  // are checked here rather than clamped, so an out-of-range row is treated as
  // an unverifiable hash instead of silently downgrading its cost.
  if (N < 2 || N > SCRYPT_MAX_N || (N & (N - 1)) !== 0) return null
  if (r < 1 || r > SCRYPT_MAX_R || p < 1 || p > SCRYPT_MAX_P) return null
  if (N * r > SCRYPT_MAX_COST) return null
  if (salt.length < 8 || hash.length < 32) return null
  return { N, r, p, salt, hash }
}

function verifyLegacy(password: string, stored: string): boolean {
  // Legacy hashes were computed over the raw password — do not normalise here.
  const separator = stored.indexOf(':')
  if (separator < 1) return false
  let secret: string
  try {
    secret = legacySecret()
  } catch {
    // A misconfigured production secret must read as "wrong password", not as
    // a 500 — and must not be distinguishable from one by timing.
    return false
  }
  const salt = stored.slice(0, separator)
  const candidate = createHmac('sha256', secret).update(salt + password).digest('hex')
  return safeEqual(Buffer.from(candidate, 'hex'), Buffer.from(stored.slice(separator + 1), 'hex'))
}

/**
 * Verifies a password against either the current scrypt format or the legacy
 * `salt:hmac` format.
 *
 * Every terminal path costs one full scrypt derivation — including unknown
 * accounts, legacy hashes and unparseable rows — so response time reveals
 * nothing about which emails exist or which hash format a row uses.
 */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) {
    await burnDerivation(password)
    return false
  }
  if (!stored.startsWith(SCRYPT_PREFIX)) {
    const matched = verifyLegacy(password, stored)
    await burnDerivation(password)
    return matched
  }

  const parsed = parseScrypt(stored)
  if (!parsed) {
    await burnDerivation(password)
    return false
  }
  // Verification is on the login hot path and must total: a bad row fails the
  // login, it does not 500 it.
  try {
    const derived = await deriveScrypt(password.normalize('NFKC'), parsed.salt, parsed.hash.length, parsed)
    return safeEqual(derived, parsed.hash)
  } catch {
    return false
  }
}

/** True when a stored hash uses the legacy format or weaker scrypt parameters. */
export function needsRehash(stored: string | null | undefined): boolean {
  if (!stored) return true
  if (!stored.startsWith(SCRYPT_PREFIX)) return true
  const parsed = parseScrypt(stored)
  if (!parsed) return true
  return parsed.N < SCRYPT_PARAMS.N || parsed.r < SCRYPT_PARAMS.r || parsed.p < SCRYPT_PARAMS.p
}