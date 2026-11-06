import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Encrypts secrets (a restaurant's Stripe or PayPay key) before they are saved, so a database backup or a
 * read-only database login does not expose keys that control real money.
 *
 * AES-256-GCM, stored as "enc:v1:<iv>:<tag>:<ciphertext>" (base64 parts). A stored value without that
 * prefix is an older plaintext key: decryptSecret returns it unchanged, so keys saved before this existed keep
 * working and get encrypted the next time they are saved.
 */
const PREFIX = 'enc:v1:';

let warnedDevKey = false;

function encryptionKey(): Buffer {
  const configured = process.env.SECRETS_ENCRYPTION_KEY;
  if (configured) {
    const key = Buffer.from(configured, 'base64');
    if (key.length !== 32) throw new Error('SECRETS_ENCRYPTION_KEY must be 32 bytes, base64 encoded (openssl rand -base64 32)');
    return key;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECRETS_ENCRYPTION_KEY is not set, so payment keys cannot be saved or read safely');
  }
  // Development only: a stable key derived from the JWT secret keeps local saves working without extra setup.
  if (!warnedDevKey) {
    warnedDevKey = true;
    // eslint-disable-next-line no-console
    console.warn('SECRETS_ENCRYPTION_KEY is not set: using a development key derived from JWT_ACCESS_SECRET.');
  }
  return createHash('sha256').update(`dev-secrets:${process.env.JWT_ACCESS_SECRET ?? 'dev'}`).digest();
}

export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join(':');
}

export function decryptSecret(stored: string): string {
  if (!isEncryptedSecret(stored)) return stored; // older plaintext key
  const [iv, tag, encrypted] = stored.slice(PREFIX.length).split(':').map((part) => Buffer.from(part, 'base64'));
  if (!iv || !tag || !encrypted) throw new Error('Stored secret is malformed');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
