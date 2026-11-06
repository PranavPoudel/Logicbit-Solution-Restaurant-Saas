import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { fromStripeAmount, isStripeCurrencySupported, toStripeAmount } from './stripe-amount.util';

describe('stripe amounts', () => {
  it('sends yen as whole yen, not hundredths', () => {
    assert.equal(toStripeAmount(1154, 'JPY'), 1154);
    assert.equal(toStripeAmount(1154, 'jpy'), 1154);
    assert.equal(fromStripeAmount(1154, 'JPY'), 1154);
  });

  it('sends two-decimal currencies in cents without float drift', () => {
    assert.equal(toStripeAmount(12.5, 'USD'), 1250);
    assert.equal(toStripeAmount(19.99, 'USD'), 1999);
    assert.equal(toStripeAmount(1.005, 'NPR'), 101);
    assert.equal(fromStripeAmount(1999, 'usd'), 19.99);
  });

  it('round-trips an amount', () => {
    for (const [amount, currency] of [[1154, 'JPY'], [12.5, 'USD'], [4000, 'NPR']] as const) {
      assert.equal(fromStripeAmount(toStripeAmount(amount, currency), currency), amount);
    }
  });

  it('refuses three-decimal currencies instead of mis-charging', () => {
    assert.equal(isStripeCurrencySupported('KWD'), false);
    assert.equal(isStripeCurrencySupported('JPY'), true);
    assert.throws(() => toStripeAmount(1, 'KWD'), /not supported/);
  });
});
