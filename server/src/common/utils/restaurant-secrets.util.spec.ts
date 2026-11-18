import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { withoutPaymentSecrets } from './restaurant-secrets.util';

describe('withoutPaymentSecrets', () => {
  const row = { id: 'r1', name: 'Momo House', paypayApiSecret: 'pp-secret', stripeSecretKey: 'enc:v1:abc', paypayApiKey: 'pp-key' };

  it('removes both payment secrets and says whether a Stripe key is saved', () => {
    const safe = withoutPaymentSecrets(row);
    assert.ok(!('stripeSecretKey' in safe));
    assert.ok(!('paypayApiSecret' in safe));
    assert.equal(safe.hasStripeKey, true);
    assert.equal(safe.name, 'Momo House');
    assert.ok(!JSON.stringify(safe).includes('pp-secret'));
    assert.ok(!JSON.stringify(safe).includes('enc:v1'));
  });

  it('reports no Stripe key when none is saved', () => {
    assert.equal(withoutPaymentSecrets({ ...row, stripeSecretKey: null }).hasStripeKey, false);
  });

  it('works when mapped over a list', () => {
    const list = [row, { ...row, id: 'r2' }].map(withoutPaymentSecrets);
    assert.equal(list.length, 2);
    assert.ok(list.every((r) => !('stripeSecretKey' in r)));
  });
});
