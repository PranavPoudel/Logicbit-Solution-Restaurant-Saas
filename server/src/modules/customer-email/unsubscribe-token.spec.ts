import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { createUnsubscribeToken, readUnsubscribeToken, unsubscribeUrl } from './unsubscribe-token';

describe('unsubscribe token', () => {
  it('round-trips the customer and restaurant', () => {
    const token = createUnsubscribeToken('c1', 'r1');
    assert.deepEqual(readUnsubscribeToken(token), { customerId: 'c1', restaurantId: 'r1' });
  });

  it('rejects a tampered payload or signature', () => {
    const [payload, signature] = createUnsubscribeToken('c1', 'r1').split('.');
    const other = Buffer.from('c2.r1').toString('base64url');
    assert.equal(readUnsubscribeToken(`${other}.${signature}`), null);
    assert.equal(readUnsubscribeToken(`${payload}.${signature.slice(0, -2)}xx`), null);
  });

  it('rejects malformed input', () => {
    for (const bad of ['', 'abc', 'a.b.c', '.', 'a.']) assert.equal(readUnsubscribeToken(bad), null);
  });

  it('builds a link that carries the token', () => {
    const url = unsubscribeUrl('c1', 'r1');
    const token = decodeURIComponent(url.split('token=')[1]);
    assert.deepEqual(readUnsubscribeToken(token), { customerId: 'c1', restaurantId: 'r1' });
    assert.match(url, /\/unsubscribe\?token=/);
  });
});
