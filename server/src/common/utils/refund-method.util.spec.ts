import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { describeRefundPayback } from './refund-method.util';

describe('describeRefundPayback', () => {
  it('says how the money was paid back, with the reference when there is one', () => {
    assert.equal(describeRefundPayback('BANK_TRANSFER', '123'), ' by bank transfer (ref 123)');
    assert.equal(describeRefundPayback('CASH'), ' by cash');
    assert.equal(describeRefundPayback('PAYPAY', 'abc'), ' by PayPay (ref abc)');
  });

  it('says nothing for older refunds that have no method', () => {
    assert.equal(describeRefundPayback(null), '');
    assert.equal(describeRefundPayback(undefined, 'x'), '');
  });
});
