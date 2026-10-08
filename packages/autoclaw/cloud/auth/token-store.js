import { promises as fs } from 'fs';
import { dirname } from 'path';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export class TokenStore {
  constructor({ path = '.autoclaw/cloud/tokens.json', encryptionKey = null }) {
    this.path = path;
    this.encryptionKey =
      encryptionKey ?? process.env.AUTOCLAW_ENCRYPTION_KEY ?? 'default-insecure-key';
  }

  async save(tokens) {
    await this.ensureDir();

    const encrypted = this.encrypt(JSON.stringify(tokens));
    await fs.writeFile(this.path, JSON.stringify({ encrypted }, null, 2));
  }

  async load() {
    try {
      const content = await fs.readFile(this.path, 'utf8');
      const data = JSON.parse(content);
      const decrypted = this.decrypt(data.encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  async clear() {
    try {
      await fs.unlink(this.path);
    } catch {
      // File doesn't exist
    }
  }

  encrypt(plaintext) {
    const salt = randomBytes(16);
    const key = scryptSync(this.encryptionKey, salt, 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted,
    };
  }

  decrypt(data) {
    const salt = Buffer.from(data.salt, 'hex');
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');

    const key = scryptSync(this.encryptionKey, salt, 32);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async ensureDir() {
    try {
      await fs.mkdir(dirname(this.path), { recursive: true });
    } catch {
      // Already exists
    }
  }
}
