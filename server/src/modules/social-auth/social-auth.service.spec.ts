import { afterEach, beforeEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { SocialAuthError, SocialAuthService, SocialProfile } from './social-auth.service';
import { fakeTable } from '../account-security/fake-db';

process.env.GOOGLE_CLIENT_ID = 'client-id';
process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
process.env.BACKEND_URL = 'https://api.example.com';
process.env.FRONTEND_URL = 'https://app.example.com';

let customers: any[];
let socialAccounts: any[];
let loginCodes: any[];
let audits: any[];
let service: SocialAuthService;
const realFetch = globalThis.fetch;

const profile = (over: Partial<SocialProfile> = {}): SocialProfile => ({
  providerUserId: 'g-1',
  name: 'Sita Rai',
  email: 'Sita@Example.com',
  emailVerified: true,
  ...over,
});

beforeEach(() => {
  customers = [];
  socialAccounts = [];
  loginCodes = [];
  audits = [];

  const customerTable = fakeTable(customers, { isActive: true, emailVerified: true, tokenVersion: 0, failedLogins: 0, lockedUntil: null });
  const originalCreate = customerTable.create;
  // The real client creates the nested social account in the same call.
  customerTable.create = async ({ data }: any) => {
    const { socialAccounts: nested, ...rest } = data;
    const row = await originalCreate({ data: rest });
    if (nested?.create) socialAccounts.push({ id: `sa-${socialAccounts.length + 1}`, customerId: row.id, ...nested.create });
    return row;
  };

  const socialTable = fakeTable(socialAccounts);
  socialTable.findUnique = async ({ where }: any) => {
    const key = where.provider_providerUserId;
    const link = socialAccounts.find((s) => s.provider === key.provider && s.providerUserId === key.providerUserId);
    return link ? { ...link, customer: customers.find((c) => c.id === link.customerId) } : null;
  };

  const prisma = {
    customer: customerTable,
    socialAccount: socialTable,
    socialLoginCode: fakeTable(loginCodes, { usedAt: null }),
  };
  const security = {
    normalizeEmail: (email: string) => email.trim().toLowerCase(),
    findByEmail: async (_type: string, email: string) => customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null,
    audit: (...args: any[]) => void audits.push(args),
  };
  const customerAuth = { startSession: async (customer: any) => ({ success: true, data: { customer: { id: customer.id } } }) };
  service = new SocialAuthService(prisma as any, security as any, customerAuth as any);
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('SocialAuthService.findOrCreateCustomer', () => {
  it('creates a verified customer with no password and links the Google identity', async () => {
    const customer = await service.findOrCreateCustomer(profile());
    assert.equal(customer.email, 'sita@example.com');
    assert.equal(customer.emailVerified, true);
    assert.equal(customer.passwordHash, undefined);
    assert.equal(socialAccounts.length, 1);
    assert.equal(socialAccounts[0].providerUserId, 'g-1');
  });

  it('returns the same customer when the Google identity is already linked', async () => {
    const first = await service.findOrCreateCustomer(profile());
    const second = await service.findOrCreateCustomer(profile({ email: 'changed@example.com' }));
    assert.equal(second.id, first.id);
    assert.equal(customers.length, 1);
  });

  it('links to an existing verified account that has the same email, keeping its password', async () => {
    customers.push({ id: 'c1', email: 'sita@example.com', name: 'Sita', isActive: true, emailVerified: true, passwordHash: 'keep-me', tokenVersion: 0 });
    const customer = await service.findOrCreateCustomer(profile());
    assert.equal(customer.id, 'c1');
    assert.equal(customer.passwordHash, 'keep-me');
    assert.equal(socialAccounts[0].customerId, 'c1');
  });

  it('takes over an unverified account: removes its password and signs out its sessions', async () => {
    customers.push({ id: 'c1', email: 'sita@example.com', name: 'Sita', isActive: true, emailVerified: false, passwordHash: 'squatter-password', tokenVersion: 0 });
    const customer = await service.findOrCreateCustomer(profile());
    assert.equal(customer.emailVerified, true);
    assert.equal(customer.passwordHash, null);
    assert.equal(customer.tokenVersion, 1);
  });

  it('refuses an email Google has not verified, or no email at all', async () => {
    await assert.rejects(service.findOrCreateCustomer(profile({ emailVerified: false })), (e: any) => e instanceof SocialAuthError && e.code === 'email_unverified');
    await assert.rejects(service.findOrCreateCustomer(profile({ email: null })), (e: any) => e instanceof SocialAuthError && e.code === 'no_email');
    assert.equal(customers.length, 0);
  });
});

describe('one-time sign-in code', () => {
  function mockGoogle() {
    globalThis.fetch = (async (url: string) => {
      const body = String(url).includes('oauth2.googleapis.com/token')
        ? { access_token: 'at' }
        : { sub: 'g-9', name: 'Sita Rai', email: 'sita@example.com', email_verified: true };
      return { ok: true, status: 200, json: async () => body };
    }) as any;
  }

  it('turns a Google code into a single-use code that is stored only as a hash', async () => {
    mockGoogle();
    const handoff = await service.handleCallback('google-code');
    assert.match(handoff, /^[0-9a-f]{64}$/);
    assert.notEqual(loginCodes[0].codeHash, handoff);
    assert.ok(audits.some((a) => a[2] === 'AUTH_SOCIAL_LOGIN'));
  });

  it('can be exchanged once for a session, and not again', async () => {
    mockGoogle();
    const handoff = await service.handleCallback('google-code');
    const session: any = await service.exchange(handoff);
    assert.equal(session.data.customer.id, customers[0].id);
    await assert.rejects(service.exchange(handoff), (e: any) => e instanceof SocialAuthError && e.code === 'invalid_state');
  });

  it('cannot be exchanged after it expires, or if it was never issued', async () => {
    mockGoogle();
    const handoff = await service.handleCallback('google-code');
    loginCodes[0].expiresAt = new Date(Date.now() - 1000);
    await assert.rejects(service.exchange(handoff), SocialAuthError);
    await assert.rejects(service.exchange('f'.repeat(64)), SocialAuthError);
  });

  it('fails cleanly when Google rejects the code', async () => {
    globalThis.fetch = (async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) })) as any;
    await assert.rejects(service.handleCallback('bad'), (e: any) => e instanceof SocialAuthError && e.code === 'login_failed');
  });
});

describe('redirect addresses', () => {
  it('sends the browser back to the right language page with the result in the fragment', () => {
    assert.equal(service.frontendCallbackUrl('ja', { code: 'abc' }), 'https://app.example.com/ja/auth/callback#code=abc');
    assert.equal(service.frontendCallbackUrl('xx', { error: 'invalid_state' }), 'https://app.example.com/en/auth/callback#error=invalid_state');
  });

  it('uses the API address for the redirect URI that Google must be told about', () => {
    assert.equal(service.redirectUri, 'https://api.example.com/api/v1/customer-auth/google/callback');
  });
});
