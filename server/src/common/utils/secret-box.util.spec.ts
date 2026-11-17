import { afterEach, beforeEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { decryptSecret, encryptSecret, isEncryptedSecret } from './secret-box.util';

const KEY = Buffer.alloc(32, 7).toString('base64');
const saved = { key: process.env.SECRETS_ENCRYPTION_KEY, env: process.env.NODE_ENV };

beforeEach(() => {
  process.env.SECRETS_ENCRYPTION_KEY = KEY;
});
afterEach(() => {
  if (saved.key === undefined) delete process.env.SECRETS_ENCRYPTION_KEY;
  else process.env.SECRETS_ENCRYPTION_KEY = saved.key;
  process.env.NODE_ENV = saved.env;
});

describe('secret-box', () => {
  it('round-trips a key and never stores it as plain text', () => {
    const stored = encryptSecret('sk_live_abc123');
    assert.ok(isEncryptedSecret(stored));
    assert.ok(!stored.includes('sk_live_abc123'));
    assert.equal(decryptSecret(stored), 'sk_live_abc123');
  });

  it('gives a different result each time for the same key', () => {
    assert.notEqual(encryptSecret('same'), encryptSecret('same'));
  });

  it('returns an older plaintext key unchanged, so keys saved before encryption keep working', () => {
    assert.equal(decryptSecret('sk_test_plain'), 'sk_test_plain');
    assert.equal(isEncryptedSecret('sk_test_plain'), false);
  });

  it('refuses a value that was tampered with', () => {
    const stored = encryptSecret('sk_live_abc123');
    const parts = stored.split(':');
    parts[parts.length - 1] = Buffer.from('tampered').toString('base64');
    assert.throws(() => decryptSecret(parts.join(':')));
  });

  it('cannot be read with a different key', () => {
    const stored = encryptSecret('sk_live_abc123');
    process.env.SECRETS_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');
    assert.throws(() => decryptSecret(stored));
  });

  it('refuses a key that is not 32 bytes', () => {
    process.env.SECRETS_ENCRYPTION_KEY = Buffer.alloc(10).toString('base64');
    assert.throws(() => encryptSecret('x'), /32 bytes/);
  });

  it('in production, refuses to save or read keys when no encryption key is set', () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    process.env.NODE_ENV = 'production';
    assert.throws(() => encryptSecret('x'), /SECRETS_ENCRYPTION_KEY is not set/);
  });

  it('outside production, falls back to a development key so local saves work', () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    process.env.NODE_ENV = 'development';
    assert.equal(decryptSecret(encryptSecret('sk_test_dev')), 'sk_test_dev');
  });
});
