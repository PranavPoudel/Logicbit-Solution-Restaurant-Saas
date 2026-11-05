import { afterEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { createHash, createHmac } from 'node:crypto';
import { PayPayProvider } from './paypay.provider';
import { PayPayUtil } from '../../../common/utils/paypay.util';

const restaurant = { id: 'r1', paypayMerchantId: 'm1', paypayApiKey: 'k1', paypayApiSecret: 's1', currencyCode: 'JPY' };
const order = { id: 'o1', orderNumber: 'LB-1001', currencyCode: 'JPY', restaurant };

const provider = (o: unknown = order, r: unknown = restaurant) =>
  new PayPayProvider(
    { order: { findUnique: async () => o }, restaurant: { findUnique: async () => r } } as any,
    { get: (key: string) => (key === 'PAYPAY_BASE_URL' ? 'http://paypay.test' : undefined) } as any,
  );

/** Stands in for PayPay: each route answers with { code, data } and every call is recorded. */
function fakePayPay(routes: Record<string, { code?: string; data?: unknown; status?: number } | (() => never)>) {
  const calls: { method: string; path: string; body: any; headers: Record<string, string> }[] = [];
  globalThis.fetch = (async (url: string, init: any) => {
    const path = url.replace('http://paypay.test', '');
    calls.push({ method: init.method, path, body: init.body ? JSON.parse(init.body) : null, headers: init.headers });
    const route = routes[`${init.method} ${path.replace(/\/v2\/(refunds|codes\/payments)\/.+/, '/v2/$1/:id')}`];
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

describe('PayPayUtil.generateAuthHeader', () => {
  it('signs the way PayPay checks it: api key, signature, nonce, epoch and body hash', () => {
    const body = { a: 1 };
    const header = PayPayUtil.generateAuthHeader('key-1', 'secret-1', '/v2/codes', 'POST', body);
    assert.ok(header.startsWith('hmac OPA-Auth:'));
    const [key, signature, nonce, epoch, bodyHash] = header.slice('hmac OPA-Auth:'.length).split(':');
    assert.equal(key, 'key-1');
    assert.equal(nonce.length, 8);
    assert.equal(bodyHash, createHash('md5').update(PayPayUtil.contentType).update(JSON.stringify(body)).digest('base64'));
    const message = ['/v2/codes', 'POST', nonce, epoch, PayPayUtil.contentType, bodyHash].join('\n');
    assert.equal(signature, createHmac('sha256', 'secret-1').update(message).digest('base64'));
  });

  it('signs "empty" for a request with no body', () => {
    const header = PayPayUtil.generateAuthHeader('key-1', 'secret-1', '/v2/codes/payments/o1', 'GET');
    const [, signature, nonce, epoch, bodyHash] = header.slice('hmac OPA-Auth:'.length).split(':');
    assert.equal(bodyHash, 'empty');
    const message = ['/v2/codes/payments/o1', 'GET', nonce, epoch, 'empty', 'empty'].join('\n');
    assert.equal(signature, createHmac('sha256', 'secret-1').update(message).digest('base64'));
  });
});

describe('PayPayProvider.initiate', () => {
  const context = { restaurantId: 'r1', orderNumber: 'LB-1001' };

  it('creates the payment code with the order id and returns the PayPay link', async () => {
    const calls = fakePayPay({ 'POST /v2/codes': { data: { url: 'https://paypay.test/pay/abc', merchantPaymentId: 'o1' } } });
    const result = await provider().initiate('o1', 1200, 'JPY', context);
    assert.deepEqual(result, { success: true, paymentStatus: 'UNPAID', redirectUrl: 'https://paypay.test/pay/abc', providerReference: 'o1' });
    assert.equal(calls[0].path, '/v2/codes');
    assert.equal(calls[0].body.merchantPaymentId, 'o1');
    assert.equal(calls[0].body.codeType, 'ORDER_QR');
    assert.deepEqual(calls[0].body.amount, { amount: 1200, currency: 'JPY' });
    assert.equal(calls[0].headers['X-ASSUME-MERCHANT'], 'm1');
    assert.match(calls[0].body.redirectUrl, /\/payment\/callback\?orderId=o1&provider=paypay$/);
  });

  it('refuses before calling PayPay when the restaurant has no PayPay keys', async () => {
    const calls = fakePayPay({});
    await assert.rejects(provider(order, { ...restaurant, paypayApiKey: null }).initiate('o1', 1200, 'JPY', context), /not configured/);
    assert.equal(calls.length, 0);
  });

  it('refuses a currency other than yen or an amount with decimals', async () => {
    const calls = fakePayPay({});
    await assert.rejects(provider().initiate('o1', 1200, 'NPR', context), /whole-yen/);
    await assert.rejects(provider().initiate('o1', 1200.5, 'JPY', context), /whole-yen/);
    assert.equal(calls.length, 0);
  });

  it('turns a PayPay failure into a clean gateway error', async () => {
    fakePayPay({ 'POST /v2/codes': { code: 'INVALID_PARAMS', status: 400 } });
    await assert.rejects(provider().initiate('o1', 1200, 'JPY', context), /PayPay could not start the payment: INVALID_PARAMS/);
  });
});

describe('PayPayProvider.checkPayment', () => {
  it('reports a completed payment with the amount PayPay saw', async () => {
    const calls = fakePayPay({ 'GET /v2/codes/payments/:id': { data: { status: 'COMPLETED', amount: { amount: 1200, currency: 'JPY' } } } });
    assert.deepEqual(await provider().checkPayment('o1'), { paid: true, amount: 1200, currency: 'JPY' });
    assert.equal(calls[0].path, '/v2/codes/payments/o1');
  });

  it('is not paid while PayPay shows anything but completed, or when PayPay is unreachable', async () => {
    fakePayPay({ 'GET /v2/codes/payments/:id': { data: { status: 'CREATED' } } });
    assert.equal((await provider().checkPayment('o1')).paid, false);

    fakePayPay({
      'GET /v2/codes/payments/:id': () => {
        throw new Error('socket hang up');
      },
    });
    assert.deepEqual(await provider().checkPayment('o1'), { paid: false });
  });
});

describe('PayPayProvider.refund', () => {
  it('refunds the PayPay payment id and reports it completed', async () => {
    const calls = fakePayPay({
      'GET /v2/codes/payments/:id': { data: { paymentId: 'pp-9', status: 'COMPLETED' } },
      'POST /v2/refunds': { data: { status: 'COMPLETED' } },
    });
    const result = await provider().refund('o1', 40);
    assert.equal(result.status, 'COMPLETED');
    assert.ok(result.providerReference);
    const sent = calls.find((c) => c.method === 'POST')!;
    assert.equal(sent.body.paymentId, 'pp-9');
    assert.deepEqual(sent.body.amount, { amount: 40, currency: 'JPY' });
    assert.equal(sent.body.merchantRefundId, result.providerReference);
    assert.equal(calls[0].path, '/v2/codes/payments/o1');
  });

  it('keeps a refund PayPay has not finished as pending', async () => {
    fakePayPay({
      'GET /v2/codes/payments/:id': { data: { paymentId: 'pp-9', status: 'COMPLETED' } },
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
      'GET /v2/codes/payments/:id': { data: { paymentId: 'pp-9', status: 'COMPLETED' } },
      'POST /v2/refunds': { data: { status: 'COMPLETED' } },
    });
    const result = await provider().refund('o1', 40, 'earlier-id');
    assert.equal(result.status, 'COMPLETED');
    assert.notEqual(result.providerReference, 'earlier-id');
    assert.equal(calls.filter((c) => c.method === 'POST').length, 1);
  });

  it('fails with PayPay\'s message when it rejects the refund', async () => {
    fakePayPay({
      'GET /v2/codes/payments/:id': { data: { paymentId: 'pp-9', status: 'COMPLETED' } },
      'POST /v2/refunds': { code: 'INVALID_REFUND_AMOUNT', status: 400 },
    });
    const result = await provider().refund('o1', 40);
    assert.equal(result.status, 'FAILED');
    assert.equal(result.message, 'INVALID_REFUND_AMOUNT');
  });

  it('fails when PayPay does not show the payment as completed or cannot be reached', async () => {
    fakePayPay({ 'GET /v2/codes/payments/:id': { data: { paymentId: 'pp-9', status: 'CREATED' } } });
    assert.equal((await provider().refund('o1', 40)).status, 'FAILED');

    fakePayPay({
      'GET /v2/codes/payments/:id': () => {
        throw new Error('socket hang up');
      },
    });
    const down = await provider().refund('o1', 40);
    assert.deepEqual([down.status, down.message], ['FAILED', 'socket hang up']);
  });

  it('fails without calling PayPay when the restaurant has no PayPay keys', async () => {
    const calls = fakePayPay({});
    const bare = { ...order, restaurant: { ...restaurant, paypayMerchantId: null } };
    const result = await provider(bare).refund('o1', 40);
    assert.equal(result.status, 'FAILED');
    assert.equal(calls.length, 0);
  });
});
