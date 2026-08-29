import { createHmac, createHash } from 'crypto'

const HMAC_SECRET = process.env.HMAC_SECRET || 'change-me-in-production'

/** SHA-256 of a string */
export function sha256(data) {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex')
}

/** HMAC-SHA256 signature for agent output integrity */
export function signOutput(payload) {
  return createHmac('sha256', HMAC_SECRET).update(JSON.stringify(payload)).digest('hex')
}

/** Build hash-chain link: SHA-256(prevHash + payload) */
export function chainHash(prevHash, payload) {
  return sha256((prevHash || '') + JSON.stringify(payload))
}
