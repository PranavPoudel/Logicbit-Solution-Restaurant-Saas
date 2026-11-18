import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { toE164 } from './phone.util';

describe('toE164', () => {
  it('keeps numbers that are already international, tidying the formatting', () => {
    assert.equal(toE164('+81 90-1234-5678'), '+819012345678');
    assert.equal(toE164('+977 (980) 123-4567'), '+9779801234567');
    assert.equal(toE164('0081 90 1234 5678'), '+819012345678');
  });

  it('adds the restaurant country code to a local number and drops the leading 0', () => {
    assert.equal(toE164('090-1234-5678', 'JP'), '+819012345678');
    assert.equal(toE164('090 1234 5678', 'Japan'), '+819012345678');
    assert.equal(toE164('9801234567', 'np'), '+9779801234567');
  });

  it('returns null when it cannot be sure', () => {
    assert.equal(toE164('090-1234-5678'), null);
    assert.equal(toE164('090-1234-5678', 'FR'), null);
    assert.equal(toE164(null, 'JP'), null);
    assert.equal(toE164('', 'JP'), null);
    assert.equal(toE164('call me', 'JP'), null);
    assert.equal(toE164('+8111', 'JP'), null);
    assert.equal(toE164('+0123456789'), null);
  });
});
