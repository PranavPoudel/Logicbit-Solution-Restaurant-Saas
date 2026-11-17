import { afterEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { decryptSecret } from '../../../common/utils/secret-box.util';
import { UberDirectAccountService } from './uber-direct-account.service';

const RID = '5e0c1d3a-5c27-4b4e-bd21-1407858d8288';
const creds = { clientId: 'client-1', clientSecret: 'secret-1', customerId: 'cus-1', signingKey: 'sign-1' };
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function build(opts: { row?: Record<string, unknown> | null; restaurantExists?: boolean; settings?: Record<string, string> } = {}) {
  const state = { row: opts.row ?? null, upserts: [] as any[], deletes: 0, logs: [] as any[] };
  const prisma = {
    restaurant: { findFirst: async (args: any) => (opts.restaurantExists === false || args.where.tenantId !== 't1' ? null : { id: args.where.id }) },
    restaurantUberDirect: {
      findUnique: async () => state.row,
      upsert: async (args: any) => (state.upserts.push(args), (state.row = { id: 'u1', restaurantId: RID, ...args.create })),
      delete: async () => (state.deletes++, (state.row = null)),
    },
  };
  const config = { get: (key: string) => ({ UBER_DIRECT_AUTH_URL: 'http://uber.test', BACKEND_URL: 'https://api.example.com/', ...opts.settings })[key] };
  const activityLog = { log: async (entry: unknown) => state.logs.push(entry) };
  return { service: new UberDirectAccountService(prisma as any, config as any, activityLog as any), state };
}

function uberAnswers(status: number) {
  const requests: { url: string; body: Record<string, string> }[] = [];
  globalThis.fetch = (async (url: string, init: any) => {
    requests.push({ url, body: Object.fromEntries(init.body) });
    return status === 200 ? Response.json({ access_token: 'tok', expires_in: 2592000 }) : new Response('no', { status });
  }) as typeof fetch;
  return requests;
}

describe('UberDirectAccountService.save', () => {
  it('lets only the owner connect an Uber account, and checks nothing with Uber first', async () => {
    const requests = uberAnswers(200);
    const { service, state } = build();
    await assert.rejects(service.save('t1', RID, 'u1', false, creds), ForbiddenException);
    assert.equal(requests.length, 0);
    assert.equal(state.upserts.length, 0);
  });

  it('only works on the owner\'s own restaurants', async () => {
    uberAnswers(200);
    await assert.rejects(build().service.save('other-tenant', RID, 'u1', true, creds), NotFoundException);
  });

  it('refuses details that Uber does not accept, and saves nothing', async () => {
    uberAnswers(401);
    const { service, state } = build();
    await assert.rejects(service.save('t1', RID, 'u1', true, creds), (e: Error) => e instanceof BadRequestException && /did not accept/.test(e.message));
    assert.equal(state.upserts.length, 0);
  });

  it('says so when Uber cannot be reached, and saves nothing', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const { service, state } = build();
    await assert.rejects(service.save('t1', RID, 'u1', true, creds), (e: Error) => e instanceof BadRequestException && /Could not reach Uber/.test(e.message));
    assert.equal(state.upserts.length, 0);
  });

  it('checks the login with Uber, saves the secrets encrypted, and never returns them', async () => {
    const requests = uberAnswers(200);
    const { service, state } = build();
    const result = await service.save('t1', RID, 'u1', true, creds);

    assert.equal(requests[0].url, 'http://uber.test/oauth/v2/token');
    assert.deepEqual(requests[0].body, { client_id: 'client-1', client_secret: 'secret-1', grant_type: 'client_credentials', scope: 'eats.deliveries' });

    const saved = state.upserts[0].create;
    assert.match(saved.clientSecret, /^enc:v1:/);
    assert.match(saved.signingKey, /^enc:v1:/);
    assert.equal(decryptSecret(saved.clientSecret), 'secret-1');
    assert.equal(decryptSecret(saved.signingKey), 'sign-1');
    assert.equal(saved.clientId, 'client-1');
    assert.equal(saved.customerId, 'cus-1');
    assert.deepEqual(state.upserts[0].update, { clientId: saved.clientId, clientSecret: saved.clientSecret, customerId: saved.customerId, signingKey: saved.signingKey });

    const shown = JSON.stringify(result);
    assert.ok(!shown.includes('secret-1') && !shown.includes('sign-1') && !shown.includes('enc:v1'));
    assert.equal(result.connected, true);
    assert.equal(state.logs.length, 1);
  });
});

describe('UberDirectAccountService.status', () => {
  it('shows whether an account is saved, and the address to give Uber, without any secret', async () => {
    const { service } = build({ row: { clientId: 'client-1', customerId: 'cus-1', clientSecret: 'enc:v1:x', signingKey: 'enc:v1:y' } });
    const status = await service.status('t1', RID);
    assert.deepEqual(status, { connected: true, clientId: 'client-1', customerId: 'cus-1', webhookPath: `/api/v1/delivery-webhooks/uber/${RID}`, webhookUrl: `https://api.example.com/api/v1/delivery-webhooks/uber/${RID}` });
    assert.equal((await build().service.status('t1', RID)).connected, false);
    assert.equal((await build({ settings: { BACKEND_URL: '' } }).service.status('t1', RID)).webhookUrl, null);
    await assert.rejects(build().service.status('other-tenant', RID), NotFoundException);
  });
});

describe('UberDirectAccountService.forRestaurant', () => {
  it('gives the restaurant\'s own client and decrypted signing key, or nothing', async () => {
    uberAnswers(200);
    const saved = build();
    await saved.service.save('t1', RID, 'u1', true, creds);
    const { service } = build({ row: saved.state.row });
    const account = await service.forRestaurant(RID);
    assert.equal(account?.signingKey, 'sign-1');
    assert.equal(await build().service.forRestaurant(RID), null);
  });

  it('keeps one client (and its login token) per restaurant until the account is saved again', async () => {
    uberAnswers(200);
    const { service } = build();
    await service.save('t1', RID, 'u1', true, creds);
    const first = await service.forRestaurant(RID);
    assert.equal((await service.forRestaurant(RID))?.client, first?.client);
    await service.save('t1', RID, 'u1', true, { ...creds, clientSecret: 'secret-2' });
    assert.notEqual((await service.forRestaurant(RID))?.client, first?.client);
  });
});

describe('UberDirectAccountService.remove', () => {
  const connected = { id: 'u1', restaurantId: RID, ...creds };

  it('lets only the owner remove it', async () => {
    await assert.rejects(build({ row: connected }).service.remove('t1', RID, 'u1', false), ForbiddenException);
  });

  it('refuses when nothing is saved', async () => {
    await assert.rejects(build().service.remove('t1', RID, 'u1', true), BadRequestException);
  });

  it('removes it and forgets the saved details', async () => {
    const { service, state } = build({ row: connected });
    const result = await service.remove('t1', RID, 'u1', true);
    assert.equal(state.deletes, 1);
    assert.equal(result.connected, false);
    assert.equal(state.logs.length, 1);
  });
});
