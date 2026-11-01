import { afterEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { PayPayProvider } from './paypay.provider';

const order = {
  id: 'o1',
  orderNumber: 'LB-1001',
  currencyCode: 'JPY',
  restaurant: { paypayMerchantId: 'm1', paypayApiSecret: 's1', currencyCode: 'JPY' },
};

const provider = (o: unknown = order) =>
  new PayPayProvider({ order: { findUnique: async () => o } } as any, { get: () => 'http://paypay.test' } as any);

/** Stands in for PayPay: each route answers with { code, data } and every call is recorded. */
function fakePayPay(routes: Record<string, { code?: string; data?: unknown; status?: number } | (() => never)>) {
  const calls: { method: string; path: string; body: any }[] = [];
  globalThis.fetch = (async (url: string, init: any) => {
    const path = url.replace('http://paypay.test', '');
    calls.push({ method: init.method, path, body: init.body ? JSON.parse(init.body) : null });
    const route = routes[`${init.method} ${path.replace(/\/v2\/(refunds|payments)\/.+/, '/v2/$1/:id')}`];
    if (!route) return { ok: false, status: 404, statusText: 'Not Found', json: async () => ({ resultInfo: { code: 'NOT_FOUND', message: 'No such route' } }) };
    if (typeof route === 'function') route();
    const r = route as { code?: string; data?: unknown; status?: number };
    const ok = (r.status ?? 200) < 400;
    return { ok, status: r.status ?? 200, statusText: '', json: async () => ({ resultInfo: { code: r.code ?? 'SUCCESS', message: r.code ?? 'ok' }, data: r.data }) };
  }) as any;
  return calls;
}

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('PayPayProvider.refund', () => {
  it('refunds the PayPay payment id and reports it completed', async () => {
    const calls = fakePayPay({
      'GET /v2/payments/:id': { data: { paymentId: 'pp-9', status: 'COMPLETED' } },
      'POST /v2/refunds': { data: { status: 'COMPLETED' } },
    });
    const result = await provider().refund('o1', 40);
    assert.equal(result.status, 'COMPLETED');
    assert.ok(result.providerReference);
    const sent = calls.find((c) => c.method === 'POST')!;
    assert.equal(sent.body.paymentId, 'pp-9');
    assert.deepEqual(sent.body.amount, { amount: 40, currency: 'JPY' });
    assert.equal(sent.body.merchantRefundId, result.providerReference);
    assert.equal(calls[0].path, '/v2/payments/o1');
  });

  it('keeps a refund PayPay has not finished as pending', async () => {
    fakePayPay({
      'GET /v2/payments/:id': { data: { paymentId: 'pp-9', status: 'COMPLETED' } },
      'POST /v2/refunds': { data: { status: 'CREATED' } },
    });
    assert.equal((await provider().refund('o1', 40)).status, 'PENDING');
  });

  it('checks an earlier pending refund instead of sending a second one', async () => {
    const calls = fakePayPay({ 'GET /v2/refunds/:id': { data: { status: 'COMPLETED' } } });
    const result = await provider().refund('o1', 40, 'earlier-id');
    assert.deepEqual(result, { status: 'COMPLETED', providerReference: 'earlier-id' });
    assert.equal(calls.length, 1);
  });

  it('sends a fresh refund when the earlier one failed at PayPay', async () => {
    const calls = fakePayPay({
      'GET /v2/refunds/:id': { data: { status: 'FAILED' } },
      'GET /v2/payments/:id': { data: { paymentId: 'pp-9', status: 'COMPLETED' } },
      'POST /v2/refunds': { data: { status: 'COMPLETED' } },
    });
    const result = await provider().refund('o1', 40, 'earlier-id');
    assert.equal(result.status, 'COMPLETED');
    assert.notEqual(result.providerReference, 'earlier-id');
    assert.equal(calls.filter((c) => c.method === 'POST').length, 1);
  });

  it('fails with PayPay\'s message when it rejects the refund', async () => {
    fakePayPay({
      'GET /v2/payments/:id': { data: { paymentId: 'pp-9', status: 'COMPLETED' } },
      'POST /v2/refunds': { code: 'INVALID_REFUND_AMOUNT', status: 400 },
    });
    const result = await provider().refund('o1', 40);
    assert.equal(result.status, 'FAILED');
    assert.equal(result.message, 'INVALID_REFUND_AMOUNT');
  });

  it('fails when PayPay does not show the payment as completed or cannot be reached', async () => {
    fakePayPay({ 'GET /v2/payments/:id': { data: { paymentId: 'pp-9', status: 'CREATED' } } });
    assert.equal((await provider().refund('o1', 40)).status, 'FAILED');

    fakePayPay({
      'GET /v2/payments/:id': () => {
        throw new Error('socket hang up');
      },
    });
    const down = await provider().refund('o1', 40);
    assert.deepEqual([down.status, down.message], ['FAILED', 'socket hang up']);
  });

  it('fails without calling PayPay when the restaurant has no PayPay keys', async () => {
    const calls = fakePayPay({});
    const bare = { ...order, restaurant: { ...order.restaurant, paypayMerchantId: null } };
    const result = await provider(bare).refund('o1', 40);
    assert.equal(result.status, 'FAILED');
    assert.equal(calls.length, 0);
  });
});
