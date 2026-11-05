import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException } from '@nestjs/common';
import { CustomerEmailService, deliveryState } from './customer-email.service';
import { createUnsubscribeToken } from './unsubscribe-token';

type Recipient = { id: string; emailId: string; customerId: string; email: string; status: string; attempts: number; sentAt?: Date };

function build(opts: { unsubscribed?: string[]; sendStatus?: () => string } = {}) {
  const email = { id: 'e1', tenantId: 't1', restaurantId: 'r1', subject: 'Hi', body: 'Hello', recipientCount: 0, sentCount: 0, failedCount: 0, audience: 'ALL' };
  const recipients: Recipient[] = [];
  const unsubscribed = new Set(opts.unsubscribed ?? []);
  const sent: { to: string; body: string }[] = [];

  const customers = [
    { id: 'c1', name: 'Asha', email: 'asha@test.com' },
    { id: 'c2', name: 'Bikash', email: 'bikash@test.com' },
    { id: 'c3', name: 'Chandra', email: 'chandra@test.com' },
  ];

  const prisma: any = {
    restaurant: {
      findFirst: async () => ({ id: 'r1', name: 'Momo House' }),
      findUnique: async () => ({ name: 'Momo House' }),
    },
    order: {
      groupBy: async () => customers.map((c) => ({ customerId: c.id, _count: { _all: 1 } })),
      findFirst: async () => ({ id: 'o1', orderNumber: 'ORD-1', status: 'DELIVERED', total: 100, items: [] }),
    },
    customer: {
      findMany: async () => customers,
      findFirst: async ({ where }: any) => customers.find((c) => c.id === where.id) ?? null,
    },
    emailUnsubscribe: {
      findMany: async () => [...unsubscribed].map((customerId) => ({ customerId })),
      findUnique: async ({ where }: any) => (unsubscribed.has(where.customerId_restaurantId.customerId) ? { id: 'u' } : null),
      upsert: async ({ create }: any) => void unsubscribed.add(create.customerId),
      deleteMany: async ({ where }: any) => void unsubscribed.delete(where.customerId),
    },
    customerEmail: {
      count: async () => 0,
      create: async ({ data }: any) => Object.assign(email, data, { createdAt: new Date() }),
      update: async ({ data }: any) => {
        for (const [k, v] of Object.entries<any>(data)) {
          if (v && typeof v === 'object' && 'increment' in v) (email as any)[k] += v.increment;
          else if (v && typeof v === 'object' && 'decrement' in v) (email as any)[k] -= v.decrement;
          else (email as any)[k] = v;
        }
        return email;
      },
    },
    customerEmailRecipient: {
      createMany: async ({ data }: any) => void data.forEach((d: any, i: number) => recipients.push({ id: `rec${i}`, status: 'PENDING', attempts: 0, ...d })),
      findMany: async ({ take }: any) => recipients.filter((r) => r.status === 'PENDING').slice(0, take).map((r) => ({ ...r, customerEmail: email })),
      updateMany: async ({ where, data }: any) => {
        const row = recipients.find((r) => r.id === where.id && r.status === where.status);
        if (!row) return { count: 0 };
        row.status = data.status;
        if (data.attempts?.increment) row.attempts += data.attempts.increment;
        return { count: 1 };
      },
      update: async ({ where, data }: any) => Object.assign(recipients.find((r) => r.id === where.id)!, data),
      delete: async ({ where }: any) => void recipients.splice(recipients.findIndex((r) => r.id === where.id), 1),
    },
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
  };
  const notifications: any = {
    send: async (p: any) => {
      sent.push({ to: p.recipient, body: p.body });
      return { status: (opts.sendStatus ?? (() => 'SENT'))() };
    },
  };
  return { service: new CustomerEmailService(prisma, notifications), email, recipients, sent, unsubscribed };
}

const broadcast = { audience: 'ALL' as const, subject: 'Hi', body: 'Hello' };

describe('CustomerEmailService queue', () => {
  it('queues one row per customer who has not unsubscribed', async () => {
    const { service, recipients, email } = build({ unsubscribed: ['c2'] });
    const result = await service.send('t1', 'r1', broadcast);
    assert.deepEqual(recipients.map((r) => r.customerId), ['c1', 'c3']);
    assert.equal(result.recipientCount, 2);
    assert.equal(result.state, 'SENDING');
    assert.equal(email.sentCount, 0);
  });

  it('sends queued emails with an unsubscribe link and counts them', async () => {
    const { service, email, sent, recipients } = build();
    await service.send('t1', 'r1', broadcast);
    await service.processQueue();
    assert.equal(sent.length, 3);
    assert.match(sent[0].body, /Unsubscribe: .*\/unsubscribe\?token=/);
    assert.equal(email.sentCount, 3);
    assert.ok(recipients.every((r) => r.status === 'SENT'));
    assert.equal(deliveryState(email), 'DONE');
  });

  it('skips and uncounts someone who unsubscribed while waiting', async () => {
    const { service, email, sent, unsubscribed, recipients } = build();
    await service.send('t1', 'r1', broadcast);
    unsubscribed.add('c1');
    await service.processQueue();
    assert.equal(sent.some((s) => s.to === 'asha@test.com'), false);
    assert.equal(email.recipientCount, 2);
    assert.equal(email.sentCount, 2);
    assert.equal(recipients.length, 2);
  });

  it('retries a failed send, then gives up after three tries', async () => {
    const { service, email, recipients } = build({ sendStatus: () => 'FAILED' });
    await service.send('t1', 'r1', { ...broadcast });
    for (let i = 0; i < 3; i++) await service.processQueue();
    assert.ok(recipients.every((r) => r.status === 'FAILED' && r.attempts === 3));
    assert.equal(email.failedCount, 3);
    assert.equal(deliveryState(email), 'DONE');
  });
});

describe('CustomerEmailService unsubscribes', () => {
  it('refuses a promotional email to one customer who unsubscribed', async () => {
    const { service } = build({ unsubscribed: ['c1'] });
    await assert.rejects(service.send('t1', 'r1', { audience: 'ONE', customerId: 'c1', subject: 'Hi', body: 'Hello' }), BadRequestException);
  });

  it('still lets the restaurant write to them about their own order', async () => {
    const { service, sent } = build({ unsubscribed: ['c1'] });
    const result = await service.send('t1', 'r1', { audience: 'ONE', customerId: 'c1', orderId: 'o1', subject: 'Hi', body: 'Hello' });
    assert.equal(result.sentCount, 1);
    assert.equal(sent.length, 1);
    assert.doesNotMatch(sent[0].body, /Unsubscribe:/);
  });

  it('unsubscribes and resubscribes through the link token', async () => {
    const { service, unsubscribed } = build();
    const token = createUnsubscribeToken('c2', 'r1');
    assert.deepEqual(await service.unsubscribe(token), { restaurantName: 'Momo House', unsubscribed: true });
    assert.equal(unsubscribed.has('c2'), true);
    assert.deepEqual(await service.resubscribe(token), { restaurantName: 'Momo House', unsubscribed: false });
    assert.equal(unsubscribed.has('c2'), false);
  });

  it('rejects a link that was not signed by us', async () => {
    const { service } = build();
    await assert.rejects(service.unsubscribe('abc.def'), BadRequestException);
  });
});
