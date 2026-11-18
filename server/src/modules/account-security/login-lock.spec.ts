import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { isLocked, LOCK_MINUTES, lockExpiry } from './login-lock';

const now = new Date('2026-11-05T10:00:00Z');

describe('lockExpiry', () => {
  it('ends the lock LOCK_MINUTES after it starts', () => {
    assert.equal(lockExpiry(now).getTime(), now.getTime() + LOCK_MINUTES * 60_000);
  });
});

describe('isLocked', () => {
  it('is locked only while lockedUntil is in the future', () => {
    assert.equal(isLocked({ lockedUntil: new Date(now.getTime() + 1000) }, now), true);
    assert.equal(isLocked({ lockedUntil: new Date(now.getTime() - 1000) }, now), false);
    assert.equal(isLocked({ lockedUntil: null }, now), false);
  });
});
