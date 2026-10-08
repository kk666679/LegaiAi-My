import crypto from 'crypto';
import { requireSecret } from './secrets';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getEncryptionKey(): Buffer {
  // Outside production the legacy SESSION_SECRET fallback is kept so the dev
  // sandbox still boots. In production ENCRYPTION_KEY must be set on its own:
  // reusing the session secret would couple two cryptographic domains, so
  // rotating either would destroy the other.
  const secret = requireSecret('ENCRYPTION_KEY', { devFallback: process.env.SESSION_SECRET?.trim() });
  const salt = crypto.createHash('sha256').update('lawmate-byok-salt').digest();
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, encrypted] = ciphertext.split(':');

  if (!ivHex || !tagHex || !encrypted) {
    throw new Error('Invalid ciphertext format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function hashKeyRef(keyRef: string): string {
  return crypto.createHash('sha256').update(keyRef).digest('hex').substring(0, 16);
}

export function generateKeyRef(): string {
  return `lm_${crypto.randomBytes(24).toString('hex')}`;
}

export function redactKey(key: string): string {
  if (!key || key.length < 8) return '***';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    let message = error.message;
    message = message.replace(/sk-[a-zA-Z0-9-]{20,}/gi, '[OPENAI_KEY_REDACTED]');
    message = message.replace(/AIza[a-zA-Z0-9_-]{30,}/g, '[GOOGLE_KEY_REDACTED]');
    message = message.replace(/pplx-[a-zA-Z0-9]{20,}/gi, '[PERPLEXITY_KEY_REDACTED]');
    message = message.replace(/(api|secret|auth)[Kk]ey["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, '$1=[REDACTED]');
    message = message.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]');
    message = message.replace(/https?:\/\/[^:]+:[^@]+@/gi, 'https://[CREDENTIALS_REDACTED]@');
    return message;
  }
  return 'An unknown error occurred';
}
