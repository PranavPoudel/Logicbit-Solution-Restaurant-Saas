import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { PAYMENT_PAGE_GONE_MINUTES } from '../order/order.service';

function build({ restaurant = { id: 'r1', stripeSecretKey: 'enc:v1:abc' } as any, waiting = 0 } = {}) {
  const updates: any[] = [];
  const logged: any[] = [];
  let countArgs: any;
  const prisma = {
    restaurant: {
      findFirst: async (args: any) => (args.where.tenantId === 't1' ? restaurant : null),
      updateMany: async (args: any) => (updates.push(args), { count: 1 }),
    },
    order: { count: async (args: any) => ((countArgs = args), waiting) },
  };
  const service = new RestaurantService(prisma as any, { log: async (l: unknown) => logged.push(l) } as any);
  // the response is read back through findOne
  (service as any).findOne = async () => ({ id: 'r1', hasStripeKey: false });
  return { service, updates, logged, getCountArgs: () => countArgs };
}

describe('RestaurantService.removeStripeKey', () => {
  it('is owner only: staff cannot remove the key, and nothing changes', async () => {
    const { service, updates } = build();
    await assert.rejects(service.removeStripeKey('t1', 'r1', 'staff-1', false), ForbiddenException);
    assert.equal(updates.length, 0);
  });

  it('deletes the key, switches card payments off and records who did it', async () => {
    const { service, updates, logged } = build();
    const result = await service.removeStripeKey('t1', 'r1', 'owner-1', true);
    assert.deepEqual(updates[0].data, { stripeSecretKey: null, supportsCreditCard: false });
    assert.deepEqual(updates[0].where, { id: 'r1', tenantId: 't1' });
    assert.equal(logged[0].action, 'STRIPE_KEY_REMOVED');
    assert.equal(logged[0].actorId, 'owner-1');
    assert.equal(result.hasStripeKey, false);
  });

  it("is not available for another tenant's restaurant", async () => {
    const { service, updates } = build();
    await assert.rejects(service.removeStripeKey('other-tenant', 'r1', 'owner-1', true), NotFoundException);
    assert.equal(updates.length, 0);
  });

  it('says so when there is no key to remove', async () => {
    const { service, updates } = build({ restaurant: { id: 'r1', stripeSecretKey: null } });
    await assert.rejects(service.removeStripeKey('t1', 'r1', 'owner-1', true), BadRequestException);
    assert.equal(updates.length, 0);
  });

  it('refuses while customers are still paying by card, and changes nothing', async () => {
    const { service, updates, logged } = build({ waiting: 2 });
    await assert.rejects(service.removeStripeKey('t1', 'r1', 'owner-1', true), (error: Error) => error instanceof ConflictException && /2 customers are still paying/.test(error.message));
    assert.equal(updates.length, 0);
    assert.equal(logged.length, 0);
  });

  it('uses the singular for one waiting customer', async () => {
    const { service } = build({ waiting: 1 });
    await assert.rejects(service.removeStripeKey('t1', 'r1', 'owner-1', true), /1 customer is still paying/);
  });

  it('only counts unpaid card orders that can still have an open payment page', async () => {
    const { service, getCountArgs } = build();
    const before = Date.now();
    await service.removeStripeKey('t1', 'r1', 'owner-1', true);
    const where = getCountArgs().where;
    assert.equal(where.paymentMethod, 'CREDIT_CARD');
    assert.equal(where.paymentStatus, 'UNPAID');
    assert.equal(where.status, 'PENDING');
    assert.equal(where.restaurantId, 'r1');
    const ageMs = before - where.createdAt.gte.getTime();
    assert.ok(Math.abs(ageMs - PAYMENT_PAGE_GONE_MINUTES * 60000) < 5000, 'looks back far enough that no payment page can still be open');
  });
});
