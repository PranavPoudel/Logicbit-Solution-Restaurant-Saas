import { afterEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { StripeProvider } from './stripe.provider';

// These tests use the real client builder (the other Stripe tests replace it with a fake).
const saved = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = saved;
});

const build = (stripeApiUrl?: string) =>
  new StripeProvider({} as any, { get: (key: string) => (key === 'STRIPE_API_URL' ? stripeApiUrl : undefined) } as any) as any;

const host = (provider: any) => provider.client('sk_test_abc').getApiField('host');

describe('StripeProvider client and STRIPE_API_URL', () => {
  it('talks to the real Stripe when STRIPE_API_URL is not set', () => {
    process.env.NODE_ENV = 'development';
    assert.equal(host(build()), 'api.stripe.com');
  });

  it('points at the fake Stripe for local testing', () => {
    process.env.NODE_ENV = 'development';
    assert.equal(host(build('http://127.0.0.1:4242')), '127.0.0.1');
  });

  it('ignores STRIPE_API_URL in production, so secret keys never go to another host', () => {
    process.env.NODE_ENV = 'production';
    assert.equal(host(build('http://evil.test:4242')), 'api.stripe.com');
  });

  it('warns once, not on every call, when it is set in production', () => {
    process.env.NODE_ENV = 'production';
    const provider = build('http://evil.test:4242');
    let warnings = 0;
    provider.logger.warn = () => warnings++;
    provider.client('sk_test_abc');
    provider.client('sk_test_abc');
    assert.equal(warnings, 1);
  });
});
