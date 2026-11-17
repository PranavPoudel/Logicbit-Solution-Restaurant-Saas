import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { StripeProvider } from './stripe.provider';

const restaurant = { id: 'r1', name: 'Momo House', stripeSecretKey: 'sk_test_abc', currencyCode: 'JPY' };
const order = { id: 'o1', orderNumber: 'LB-1001', total: 1154, currencyCode: 'JPY', paymentReference: 'cs_test_1', restaurant };

interface Call {
  name: string;
  args: any[];
}

/** Stands in for Stripe: every call is recorded and each method answers from `answers`. */
function fakeStripe(answers: Record<string, unknown | (() => never)> = {}) {
  const calls: Call[] = [];
  const answer = (name: string, fallback: unknown) => async (...args: any[]) => {
    calls.push({ name, args });
    const a = answers[name] ?? fallback;
    if (typeof a === 'function') return (a as () => unknown)();
    return a;
  };
  const stripe = {
    checkout: {
      sessions: {
        create: answer('sessions.create', { id: 'cs_test_1', url: 'https://checkout.stripe.test/pay/cs_test_1' }),
        retrieve: answer('sessions.retrieve', { id: 'cs_test_1', client_reference_id: 'o1', payment_status: 'paid', amount_total: 1154, currency: 'jpy', payment_intent: 'pi_1' }),
        expire: answer('sessions.expire', { id: 'cs_test_1', status: 'expired' }),
      },
    },
    refunds: {
      create: answer('refunds.create', { id: 're_1', status: 'succeeded' }),
      retrieve: answer('refunds.retrieve', { id: 're_1', status: 'succeeded' }),
    },
  };
  return { stripe, calls };
}

class TestableStripeProvider extends StripeProvider {
  keysUsed: string[] = [];
  constructor(prisma: unknown, private readonly fake: unknown) {
    super(prisma as any, { get: (key: string) => (key === 'FRONTEND_URL' ? 'https://site.test/' : undefined) } as any);
  }
  protected client(secretKey: string) {
    this.keysUsed.push(secretKey);
    return this.fake as any;
  }
}

const build = (o: unknown = order, r: unknown = restaurant, answers: Record<string, unknown> = {}) => {
  const { stripe, calls } = fakeStripe(answers);
  const provider = new TestableStripeProvider({ order: { findUnique: async () => o }, restaurant: { findUnique: async () => r } }, stripe);
  return { provider, calls };
};

describe('StripeProvider.initiate', () => {
  const context = { restaurantId: 'r1', orderNumber: 'LB-1001' };

  it('creates a Checkout Session for the order and returns the Stripe page and session id', async () => {
    const { provider, calls } = build();
    const result = await provider.initiate('o1', 1154, 'JPY', context);
    assert.deepEqual(result, { success: true, paymentStatus: 'UNPAID', redirectUrl: 'https://checkout.stripe.test/pay/cs_test_1', providerReference: 'cs_test_1' });
    assert.deepEqual(provider.keysUsed, ['sk_test_abc']);

    const [params, options] = calls[0].args;
    assert.equal(params.mode, 'payment');
    assert.deepEqual(params.adaptive_pricing, { enabled: false }, 'charge and refund stay in the order currency');
    assert.equal(params.line_items[0].price_data.currency, 'jpy');
    assert.equal(params.line_items[0].price_data.unit_amount, 1154, 'yen are sent as whole yen, not hundredths');
    assert.equal(params.client_reference_id, 'o1');
    assert.deepEqual(params.metadata, { orderId: 'o1' });
    assert.equal(params.success_url, 'https://site.test/payment/callback?orderId=o1&provider=stripe');
    assert.equal(params.cancel_url, 'https://site.test/payment/callback?orderId=o1&provider=stripe&cancelled=1');
    assert.ok(params.expires_at > Date.now() / 1000 + 30 * 60, 'Stripe needs at least 30 minutes');
    assert.equal(options.idempotencyKey, 'checkout-o1');
  });

  it('sends two-decimal currencies in cents', async () => {
    const { provider, calls } = build();
    await provider.initiate('o1', 12.5, 'USD', context);
    assert.equal(calls[0].args[0].line_items[0].price_data.unit_amount, 1250);
    assert.equal(calls[0].args[0].line_items[0].price_data.currency, 'usd');
  });

  it('refuses when the restaurant has no Stripe key, before calling Stripe', async () => {
    const { provider, calls } = build(order, { ...restaurant, stripeSecretKey: null });
    await assert.rejects(provider.initiate('o1', 1154, 'JPY', context), /not configured/);
    assert.equal(calls.length, 0);
  });

  it('refuses a currency Stripe counts in thousandths', async () => {
    const { provider, calls } = build();
    await assert.rejects(provider.initiate('o1', 1, 'KWD', context), /not supported/);
    assert.equal(calls.length, 0);
  });

  it('turns a Stripe error into a clear gateway error', async () => {
    const { provider } = build(order, restaurant, {
      'sessions.create': () => {
        throw new Error('Invalid API Key provided');
      },
    });
    await assert.rejects(provider.initiate('o1', 1154, 'JPY', context), /Stripe could not start the payment: Invalid API Key provided/);
  });
});

describe('StripeProvider.checkPayment', () => {
  it('reports the amount and currency from Stripe, converted back to the order currency units', async () => {
    const { provider } = build();
    assert.deepEqual(await provider.checkPayment('o1'), { paid: true, amount: 1154, currency: 'JPY' });
  });

  it('converts cents back for two-decimal currencies', async () => {
    const { provider } = build(order, restaurant, { 'sessions.retrieve': { client_reference_id: 'o1', payment_status: 'paid', amount_total: 1250, currency: 'usd' } });
    assert.deepEqual(await provider.checkPayment('o1'), { paid: true, amount: 12.5, currency: 'USD' });
  });

  it('is not paid while Stripe says unpaid', async () => {
    const { provider } = build(order, restaurant, { 'sessions.retrieve': { client_reference_id: 'o1', payment_status: 'unpaid', amount_total: 1154, currency: 'jpy' } });
    assert.equal((await provider.checkPayment('o1')).paid, false);
  });

  it('is not paid when the session belongs to another order', async () => {
    const { provider } = build(order, restaurant, { 'sessions.retrieve': { client_reference_id: 'someone-else', payment_status: 'paid', amount_total: 1154, currency: 'jpy' } });
    assert.equal((await provider.checkPayment('o1')).paid, false);
  });

  it('is not paid when there is no session, no key, or Stripe cannot be reached', async () => {
    assert.equal((await build({ ...order, paymentReference: null }).provider.checkPayment('o1')).paid, false);
    assert.equal((await build({ ...order, restaurant: { ...restaurant, stripeSecretKey: null } }).provider.checkPayment('o1')).paid, false);
    assert.equal((await build(null).provider.checkPayment('o1')).paid, false);
    const down = build(order, restaurant, {
      'sessions.retrieve': () => {
        throw new Error('network down');
      },
    });
    assert.equal((await down.provider.checkPayment('o1')).paid, false);
  });
});

describe('StripeProvider.refund', () => {
  it('refunds the card payment in the right unit and reports completed', async () => {
    const { provider, calls } = build();
    const result = await provider.refund('o1', 500);
    assert.deepEqual(result, { status: 'COMPLETED', providerReference: 're_1', message: undefined });
    const create = calls.find((c) => c.name === 'refunds.create')!;
    assert.deepEqual(create.args[0], { payment_intent: 'pi_1', amount: 500, metadata: { orderId: 'o1' } });
    assert.match(create.args[1].idempotencyKey, /^refund-o1-500-\d+$/);
  });

  it('reports pending while Stripe is still working', async () => {
    const { provider } = build(order, restaurant, { 'refunds.create': { id: 're_2', status: 'pending' } });
    assert.deepEqual(await provider.refund('o1', 500), { status: 'PENDING', providerReference: 're_2', message: undefined });
  });

  it('reports a failed refund with the reason', async () => {
    const { provider } = build(order, restaurant, { 'refunds.create': { id: 're_3', status: 'failed', failure_reason: 'expired_or_canceled_card' } });
    const result = await provider.refund('o1', 500);
    assert.equal(result.status, 'FAILED');
    assert.equal(result.message, 'expired_or_canceled_card');
  });

  it('checks a refund Stripe already accepted instead of sending a second one', async () => {
    const { provider, calls } = build(order, restaurant, { 'refunds.retrieve': { id: 're_1', status: 'pending' } });
    assert.deepEqual(await provider.refund('o1', 500, 're_1'), { status: 'PENDING', providerReference: 're_1' });
    assert.ok(!calls.some((c) => c.name === 'refunds.create'));
  });

  it('sends a new refund when the earlier one failed', async () => {
    const { provider, calls } = build(order, restaurant, { 'refunds.retrieve': { id: 're_old', status: 'failed' } });
    assert.equal((await provider.refund('o1', 500, 're_old')).status, 'COMPLETED');
    assert.ok(calls.some((c) => c.name === 'refunds.create'));
  });

  it('does not refund a payment Stripe shows as unpaid', async () => {
    const { provider, calls } = build(order, restaurant, { 'sessions.retrieve': { client_reference_id: 'o1', payment_status: 'unpaid', payment_intent: null } });
    const result = await provider.refund('o1', 500);
    assert.equal(result.status, 'FAILED');
    assert.ok(!calls.some((c) => c.name === 'refunds.create'));
  });

  it('never throws: a Stripe error becomes FAILED with the message', async () => {
    const { provider } = build(order, restaurant, {
      'refunds.create': () => {
        throw new Error('Charge has already been refunded');
      },
    });
    assert.deepEqual(await provider.refund('o1', 500), { status: 'FAILED', message: 'Charge has already been refunded' });
  });

  it('fails clearly when the restaurant has no key or the order has no card payment', async () => {
    assert.equal((await build({ ...order, restaurant: { ...restaurant, stripeSecretKey: null } }).provider.refund('o1', 500)).status, 'FAILED');
    assert.equal((await build({ ...order, paymentReference: null }).provider.refund('o1', 500)).status, 'FAILED');
    assert.equal((await build(null).provider.refund('o1', 500)).status, 'FAILED');
  });
});

const open = { id: 'cs_test_1', client_reference_id: 'o1', payment_status: 'unpaid', status: 'open', url: 'https://checkout.stripe.test/pay/cs_test_1' };
const expired = { ...open, status: 'expired', url: null };

describe('StripeProvider.resume', () => {
  it('reuses the payment page that is still open, without making another', async () => {
    const { provider, calls } = build(order, restaurant, { 'sessions.retrieve': open });
    assert.deepEqual(await provider.resume('o1'), { redirectUrl: open.url, providerReference: 'cs_test_1' });
    assert.ok(!calls.some((c) => c.name === 'sessions.create'));
  });

  it('says paid when the money already arrived', async () => {
    const { provider, calls } = build(order, restaurant, { 'sessions.retrieve': { ...open, payment_status: 'paid', status: 'complete' } });
    assert.deepEqual(await provider.resume('o1'), { paid: true });
    assert.ok(!calls.some((c) => c.name === 'sessions.create'));
  });

  it('makes a fresh page for the same order and amount when the old one expired', async () => {
    const { provider, calls } = build(order, restaurant, {
      'sessions.retrieve': expired,
      'sessions.create': { id: 'cs_test_2', url: 'https://checkout.stripe.test/pay/cs_test_2' },
    });
    assert.deepEqual(await provider.resume('o1'), { redirectUrl: 'https://checkout.stripe.test/pay/cs_test_2', providerReference: 'cs_test_2' });
    const [params, options] = calls.find((c) => c.name === 'sessions.create')!.args;
    assert.equal(params.line_items[0].price_data.unit_amount, 1154);
    assert.equal(params.client_reference_id, 'o1');
    assert.equal(options.idempotencyKey, 'checkout-o1-after-cs_test_1', 'two clicks at once must get the same fresh page');
  });

  it('refuses when there is no card payment or no key, and turns Stripe errors into gateway errors', async () => {
    await assert.rejects(build({ ...order, paymentReference: null }).provider.resume('o1'), /no card payment/);
    await assert.rejects(build({ ...order, restaurant: { ...restaurant, stripeSecretKey: null } }).provider.resume('o1'), /not configured/);
    const down = build(order, restaurant, {
      'sessions.retrieve': () => {
        throw new Error('network down');
      },
    });
    await assert.rejects(down.provider.resume('o1'), /Stripe could not reopen the payment: network down/);
  });

  it('does not reuse a page that belongs to another order', async () => {
    const { provider } = build(order, restaurant, { 'sessions.retrieve': { ...open, client_reference_id: 'someone-else' } });
    await assert.rejects(provider.resume('o1'), /another order/);
  });
});

describe('StripeProvider.cancelPayment', () => {
  it('closes the open payment page', async () => {
    const { provider, calls } = build(order, restaurant, { 'sessions.retrieve': open });
    assert.deepEqual(await provider.cancelPayment('o1'), { paid: false });
    assert.deepEqual(calls.find((c) => c.name === 'sessions.expire')!.args, ['cs_test_1']);
  });

  it('reports paid and closes nothing when the money already arrived', async () => {
    const { provider, calls } = build(order, restaurant, { 'sessions.retrieve': { ...open, payment_status: 'paid', status: 'complete' } });
    assert.deepEqual(await provider.cancelPayment('o1'), { paid: true });
    assert.ok(!calls.some((c) => c.name === 'sessions.expire'));
  });

  it('is fine when the page already expired, or there is nothing to close', async () => {
    assert.deepEqual(await build(order, restaurant, { 'sessions.retrieve': expired }).provider.cancelPayment('o1'), { paid: false });
    assert.deepEqual(await build({ ...order, paymentReference: null }).provider.cancelPayment('o1'), { paid: false });
  });

  it('catches a payment that landed between the check and the close', async () => {
    let reads = 0;
    const { provider } = build(order, restaurant, {
      'sessions.retrieve': () => (++reads === 1 ? open : { ...open, payment_status: 'paid', status: 'complete' }) as never,
      'sessions.expire': () => {
        throw new Error('Only open sessions can be expired');
      },
    });
    assert.deepEqual(await provider.cancelPayment('o1'), { paid: true });
  });

  it('throws when it cannot be sure the page is closed, so the order is not cancelled', async () => {
    const { provider } = build(order, restaurant, {
      'sessions.retrieve': open,
      'sessions.expire': () => {
        throw new Error('network down');
      },
    });
    await assert.rejects(provider.cancelPayment('o1'), /could not close the payment page/);
  });
});

describe('StripeProvider.cancelPayment without a key', () => {
  it('throws instead of reporting not paid, because the open page cannot be closed or checked', async () => {
    const { provider, calls } = build({ ...order, restaurant: { ...restaurant, stripeSecretKey: null } });
    await assert.rejects(provider.cancelPayment('o1'), /cannot be closed/);
    assert.equal(calls.length, 0);
  });
});
