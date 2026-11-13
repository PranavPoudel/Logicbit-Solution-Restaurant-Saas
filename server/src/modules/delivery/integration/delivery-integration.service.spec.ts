import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { createHmac } from 'node:crypto';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DeliveryIntegrationService } from './delivery-integration.service';
import { UberDirectClient } from './uber-direct.client';
import { UberDirectProvider } from './uber-direct.provider';

const ORDER_ID = '8ef0080a-5c27-4b4e-bd21-1407858d8288';
const RESTAURANT_ID = '5e0c1d3a-5c27-4b4e-bd21-1407858d8288';
const SIGNING_KEY = 'uber-signing-key';

// Only RESTAURANT_ID has an Uber Direct account; every other restaurant has none.
function build(settings: Record<string, string | undefined> = { DELIVERY_WEBHOOK_SECRET: 's3cret' }, client = new UberDirectClient(() => ({ apiUrl: '', authUrl: '' })), signingKey: string | null = SIGNING_KEY) {
  const calls: unknown[] = [];
  const config = { get: (key: string) => settings[key] } as any;
  const deliveries = {
    applyExternalEvent: async (...args: unknown[]) => calls.push(args),
    recordBooking: async (...args: unknown[]) => calls.push(['booking', ...args]),
  } as any;
  const accounts = { forRestaurant: async (id: string) => (id === RESTAURANT_ID && signingKey ? { client, signingKey } : null) } as any;
  return { service: new DeliveryIntegrationService(config, deliveries, accounts), calls };
}

const sign = (body: string, key = SIGNING_KEY) => createHmac('sha256', key).update(body).digest('hex');

function uberEvent(status: string, data: Record<string, unknown> = {}) {
  return {
    kind: 'event.delivery_status',
    status,
    delivery_id: 'del_abc123',
    data: { id: 'del_abc123', status, tracking_url: 'https://uber.com/track/abc', ...data },
  };
}

describe('DeliveryIntegrationService (generic provider)', () => {
  it('rejects an unknown provider', async () => {
    await assert.rejects(build().service.handle('nope', {}, undefined, {}), NotFoundException);
  });

  it('rejects a missing or wrong secret, and every call when no secret is configured', async () => {
    const payload = { orderId: ORDER_ID, event: 'ASSIGNED' };
    await assert.rejects(build().service.handle('generic', {}, undefined, payload), UnauthorizedException);
    await assert.rejects(build().service.handle('generic', { 'x-delivery-secret': 'wrong' }, undefined, payload), UnauthorizedException);
    await assert.rejects(build({}).service.handle('generic', { 'x-delivery-secret': 'anything' }, undefined, payload), UnauthorizedException);
  });

  it('rejects a malformed event', async () => {
    const { service } = build();
    const headers = { 'x-delivery-secret': 's3cret' };
    await assert.rejects(service.handle('generic', headers, undefined, { orderId: 'not-a-uuid', event: 'ASSIGNED' }), BadRequestException);
    await assert.rejects(service.handle('generic', headers, undefined, { orderId: ORDER_ID, event: 'TELEPORTED' }), BadRequestException);
    await assert.rejects(service.handle('generic', headers, undefined, { orderId: ORDER_ID, event: 'ASSIGNED', surprise: true }), BadRequestException);
  });

  it('passes a valid event for the provider to the delivery service', async () => {
    const { service, calls } = build();
    const event = { orderId: ORDER_ID, event: 'ASSIGNED', externalRef: 'JOB-1', driver: { name: 'Sita', phone: '9800000000' } };
    await service.handle('generic', { 'x-delivery-secret': 's3cret' }, undefined, event);
    const [provider, parsed] = calls[0] as [string, typeof event];
    assert.equal(provider, 'generic');
    assert.equal(parsed.externalRef, 'JOB-1');
    assert.equal(parsed.driver.name, 'Sita');
  });
});

describe('Uber Direct webhook', () => {
  it('only accepts a signature made from the raw body with the restaurant\'s signing key', async () => {
    const { service } = build();
    const raw = JSON.stringify(uberEvent('pickup'));
    const body = Buffer.from(raw);
    await assert.rejects(service.handleUber(RESTAURANT_ID, {}, body, JSON.parse(raw)), UnauthorizedException);
    await assert.rejects(service.handleUber(RESTAURANT_ID, { 'x-uber-signature': sign(raw, 'other-key') }, body, JSON.parse(raw)), UnauthorizedException);
    await assert.rejects(service.handleUber(RESTAURANT_ID, { 'x-uber-signature': sign(raw) }, Buffer.from(raw + ' '), JSON.parse(raw)), UnauthorizedException);
    await assert.doesNotReject(service.handleUber(RESTAURANT_ID, { 'x-uber-signature': sign(raw) }, body, JSON.parse(raw)));
    await assert.doesNotReject(service.handleUber(RESTAURANT_ID, { 'x-postmates-signature': sign(raw) }, body, JSON.parse(raw)));
  });

  it('refuses a restaurant that has no Uber Direct account, and every other restaurant\'s address', async () => {
    const raw = JSON.stringify(uberEvent('pickup'));
    const headers = { 'x-uber-signature': sign(raw) };
    await assert.rejects(build(undefined, undefined, null).service.handleUber(RESTAURANT_ID, headers, Buffer.from(raw), JSON.parse(raw)), UnauthorizedException);
    const other = '99999999-5c27-4b4e-bd21-1407858d8288';
    await assert.rejects(build().service.handleUber(other, headers, Buffer.from(raw), JSON.parse(raw)), UnauthorizedException);
  });

  it('passes the restaurant to the delivery service so it can only touch its own orders', async () => {
    const { service, calls } = build();
    const raw = JSON.stringify(uberEvent('pickup'));
    await service.handleUber(RESTAURANT_ID, { 'x-uber-signature': sign(raw) }, Buffer.from(raw), JSON.parse(raw));
    const [provider, , restaurantId] = calls[0] as [string, unknown, string];
    assert.equal(provider, 'uber');
    assert.equal(restaurantId, RESTAURANT_ID);
  });

  it('no longer has a shared platform-wide Uber address', async () => {
    const raw = JSON.stringify(uberEvent('pickup'));
    await assert.rejects(build().service.handle('uber', { 'x-uber-signature': sign(raw) }, Buffer.from(raw), JSON.parse(raw)), NotFoundException);
  });

  const provider = new UberDirectProvider(() => SIGNING_KEY, new UberDirectClient(() => ({ apiUrl: '', authUrl: '' })));

  it('turns courier assignment into our assigned event with the driver details', () => {
    const event = provider.parse(uberEvent('pickup', { courier: { name: 'Bikash T', vehicle_type: 'scooter', public_phone_info: { phone_number: '+8150000' } } }));
    assert.deepEqual(event, {
      externalRef: 'del_abc123',
      trackingUrl: 'https://uber.com/track/abc',
      event: 'ASSIGNED',
      driver: { name: 'Bikash T', phone: '+8150000', vehicle: 'scooter' },
    });
  });

  it('maps the rest of the Uber statuses', () => {
    assert.equal(provider.parse(uberEvent('pickup_complete'))?.event, 'PICKED_UP');
    assert.equal(provider.parse(uberEvent('dropoff'))?.event, 'ON_THE_WAY');
    assert.equal(provider.parse(uberEvent('delivered'))?.event, 'DELIVERED');
    const cancelled = provider.parse(uberEvent('canceled', { cancelation_reason: { primary_reason: '#Uber', secondary_reason: 'COURIER_CANCEL' } }));
    assert.equal(cancelled?.event, 'FAILED');
    assert.equal(cancelled?.failureReason, 'COURIER_CANCEL');
    assert.equal(provider.parse(uberEvent('returned'))?.event, 'FAILED');
  });

  it('gives the useful cancel reason, never the "#Uber" placeholder', () => {
    const reason = (data: Record<string, unknown>) => provider.parse(uberEvent('canceled', data))?.failureReason;
    assert.equal(reason({ undeliverable_reason: 'Nobody home', cancelation_reason: { primary_reason: '#Uber' } }), 'Nobody home');
    assert.equal(reason({ cancelation_reason: { primary_reason: '#Uber' } }), 'Uber Direct delivery was cancelled');
  });

  it('ignores events we do not act on', () => {
    assert.equal(provider.parse(uberEvent('pending')), null);
    assert.equal(provider.parse(uberEvent('shopping_completed')), null);
    assert.equal(provider.parse({ ...uberEvent('pickup'), kind: 'event.courier_update' }), null);
    assert.equal(provider.parse({ kind: 'event.delivery_status', status: 'pickup', data: {} }), null);
  });

  it('identifies the delivery by Uber\'s delivery id', () => {
    const event = provider.parse(uberEvent('delivered'));
    assert.equal(event?.event, 'DELIVERED');
    assert.equal(event?.orderId, undefined);
    assert.equal(event?.externalRef, 'del_abc123');
  });
});

describe('Uber Direct booking', () => {
  const cfg = { clientId: 'id', clientSecret: 'secret', customerId: 'cus_1', apiUrl: 'https://api.test', authUrl: 'https://auth.test' };
  const order = {
    id: ORDER_ID,
    orderNumber: 'ORD-1',
    deliveryAddress: '1 Customer Road',
    notes: 'ring twice',
    restaurant: { id: RESTAURANT_ID, name: 'Momo House', address: '2 Kitchen Street', phone: '+819011112222', country: 'JP' },
    customer: { name: 'Test Customer', phone: '+819033334444' },
    items: [{ quantity: 2, name: 'Momo' }],
  };

  function fakeHttp(fail?: string) {
    const requests: { url: string; body: any; auth?: string }[] = [];
    const http = (async (url: string, init: any) => {
      const isForm = typeof init.body !== 'string';
      requests.push({ url, body: isForm ? Object.fromEntries(init.body) : JSON.parse(init.body), auth: init.headers.Authorization });
      if (fail && url.endsWith(fail)) return new Response('nope', { status: 500 });
      if (url.endsWith('/oauth/v2/token')) return Response.json({ access_token: 'tok', expires_in: 2592000 });
      if (url.endsWith('/delivery_quotes')) return Response.json({ id: 'dqt_1' });
      return Response.json({ id: 'del_9', tracking_url: 'https://uber.com/track/9' });
    }) as unknown as typeof fetch;
    return { http, requests };
  }

  it('does nothing when Uber Direct is not configured', async () => {
    const client = new UberDirectClient(() => ({ ...cfg, clientId: undefined }), fakeHttp().http);
    assert.equal(await client.book(order), null);
  });

  it('gets a token, a quote, then creates the delivery tied to our order', async () => {
    const { http, requests } = fakeHttp();
    const booking = await new UberDirectClient(() => cfg, http).book(order);
    assert.deepEqual(booking, { externalRef: 'del_9', trackingUrl: 'https://uber.com/track/9' });
    assert.equal(requests[0].url, 'https://auth.test/oauth/v2/token');
    assert.deepEqual(requests[0].body, { client_id: 'id', client_secret: 'secret', grant_type: 'client_credentials', scope: 'eats.deliveries' });
    assert.equal(requests[1].url, 'https://api.test/v1/customers/cus_1/delivery_quotes');
    assert.equal(requests[1].auth, 'Bearer tok');
    assert.equal(requests[2].url, 'https://api.test/v1/customers/cus_1/deliveries');
    assert.equal(requests[2].body.quote_id, 'dqt_1');
    assert.equal('external_id' in requests[2].body, false);
    assert.equal(requests[2].body.pickup_address, '2 Kitchen Street');
    assert.equal(requests[2].body.pickup_phone_number, '+819011112222');
    assert.equal(requests[2].body.dropoff_phone_number, '+819033334444');
    assert.deepEqual(requests[2].body.manifest_items, [{ name: 'Momo', quantity: 2, size: 'small' }]);
  });

  it('sends map coordinates with the quote and the delivery when they are known', async () => {
    const { http, requests } = fakeHttp();
    const located = { ...order, deliveryLatitude: 35.68, deliveryLongitude: 139.76, restaurant: { ...order.restaurant, latitude: 35.66, longitude: 139.7 } };
    await new UberDirectClient(() => cfg, http).book(located);
    const expected = { pickup_latitude: 35.66, pickup_longitude: 139.7, dropoff_latitude: 35.68, dropoff_longitude: 139.76 };
    for (const path of ['/delivery_quotes', '/deliveries']) {
      const body = requests.find((r) => r.url.endsWith(path))!.body;
      assert.deepEqual({ ...body }, { ...body, ...expected });
    }
  });

  it('leaves the coordinates out when they are not known', async () => {
    const { http, requests } = fakeHttp();
    await new UberDirectClient(() => cfg, http).book(order);
    for (const path of ['/delivery_quotes', '/deliveries']) {
      const body = requests.find((r) => r.url.endsWith(path))!.body;
      assert.ok(!('pickup_latitude' in body) && !('dropoff_longitude' in body));
    }
  });

  it('sends phone numbers in international form, even when they were saved the local way', async () => {
    const { http, requests } = fakeHttp();
    const local = { ...order, restaurant: { ...order.restaurant, phone: '090-1234-5678' }, customer: { ...order.customer, phone: '080 9999 0000' } };
    await new UberDirectClient(() => cfg, http).book(local);
    const delivery = requests.find((r) => r.url.endsWith('/deliveries'))!;
    assert.equal(delivery.body.pickup_phone_number, '+819012345678');
    assert.equal(delivery.body.dropoff_phone_number, '+818099990000');
  });

  it('does not call Uber when a phone number is missing or cannot be made international', async () => {
    for (const bad of [
      { ...order, restaurant: { ...order.restaurant, phone: null } },
      { ...order, customer: { ...order.customer, phone: null } },
      { ...order, customer: { ...order.customer, phone: '080 9999 0000' }, restaurant: { ...order.restaurant, country: null } },
    ]) {
      const { http, requests } = fakeHttp();
      await assert.rejects(new UberDirectClient(() => cfg, http).book(bad), /international form/);
      assert.equal(requests.length, 0);
    }
  });

  it('reuses the token for later bookings', async () => {
    const { http, requests } = fakeHttp();
    const client = new UberDirectClient(() => cfg, http);
    await client.book(order);
    await client.book(order);
    assert.equal(requests.filter((r) => r.url.endsWith('/oauth/v2/token')).length, 1);
  });

  it('falls back to our own riders when the booking fails', async () => {
    const { service, calls } = build({ DELIVERY_WEBHOOK_SECRET: 's3cret' });
    service.register({ name: 'broken', authenticate: () => true, parse: () => null, book: async () => { throw new Error('boom'); } });
    assert.equal(await service.requestCourier(order), false);
    assert.equal(calls.length, 0);
  });

  it('books through the restaurant\'s own Uber account and records the booking', async () => {
    const client = new UberDirectClient(() => ({ apiUrl: '', authUrl: '' }));
    client.book = async () => ({ externalRef: 'del_1', trackingUrl: 'https://uber.com/track/1' });
    const { service, calls } = build(undefined, client);
    assert.equal(await service.requestCourier(order), true);
    assert.deepEqual(calls[0], ['booking', ORDER_ID, { externalRef: 'del_1', trackingUrl: 'https://uber.com/track/1' }]);
  });

  it('never books Uber for a restaurant that has no Uber account, so the platform is never billed', async () => {
    let booked = false;
    const client = new UberDirectClient(() => ({ apiUrl: '', authUrl: '' }));
    client.book = async () => ((booked = true), { externalRef: 'del_1' });
    const { service, calls } = build(undefined, client);
    const elsewhere = { ...order, restaurant: { ...order.restaurant, id: '99999999-5c27-4b4e-bd21-1407858d8288' } };
    assert.equal(await service.requestCourier(elsewhere), false);
    assert.equal(booked, false);
    assert.equal(calls.length, 0);
  });

  it('falls back to our own riders when the restaurant\'s Uber booking fails', async () => {
    const client = new UberDirectClient(() => ({ apiUrl: '', authUrl: '' }));
    client.book = async () => {
      throw new Error('Uber is down');
    };
    const { service, calls } = build(undefined, client);
    assert.equal(await service.requestCourier(order), false);
    assert.equal(calls.length, 0);
  });

  it('records the booking when a provider books a courier', async () => {
    const { service, calls } = build({ DELIVERY_WEBHOOK_SECRET: 's3cret' });
    service.register({ name: 'ok', authenticate: () => true, parse: () => null, book: async () => ({ externalRef: 'REF-1', trackingUrl: 'https://t/1' }) });
    assert.equal(await service.requestCourier(order), true);
    assert.deepEqual(calls[0], ['booking', ORDER_ID, { externalRef: 'REF-1', trackingUrl: 'https://t/1' }]);
  });
});
