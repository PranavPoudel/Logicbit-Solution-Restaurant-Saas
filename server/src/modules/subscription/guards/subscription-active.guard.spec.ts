import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AllowWithoutPlan, SubscriptionActiveGuard, subscriptionBlockedReason } from './subscription-active.guard';

const now = new Date('2026-11-03T00:00:00Z');
const day = 24 * 60 * 60 * 1000;

describe('subscriptionBlockedReason', () => {
  it('lets a live subscription through, with or without an expiry date', () => {
    assert.equal(subscriptionBlockedReason({ status: 'ACTIVE', expiryDate: new Date(+now + day) }, now), null);
    assert.equal(subscriptionBlockedReason({ status: 'ACTIVE', expiryDate: null }, now), null);
  });

  it('blocks a restaurant with no subscription', () => {
    assert.ok(subscriptionBlockedReason(null, now));
  });

  it('blocks expired and cancelled subscriptions', () => {
    assert.ok(subscriptionBlockedReason({ status: 'EXPIRED', expiryDate: new Date(+now + day) }, now));
    assert.ok(subscriptionBlockedReason({ status: 'CANCELLED', expiryDate: null }, now));
  });

  it('blocks an ACTIVE subscription whose expiry date has passed before the cron marks it expired', () => {
    assert.ok(subscriptionBlockedReason({ status: 'ACTIVE', expiryDate: new Date(+now - day) }, now));
  });
});

describe('SubscriptionActiveGuard', () => {
  @AllowWithoutPlan()
  class OpenController {}
  class ClosedController {}

  const run = (params: Record<string, string>, restaurant: object | null, subscription: object | null, controller: new () => object = ClosedController) => {
    const prisma = {
      restaurant: { findFirst: async () => restaurant },
      restaurantSubscription: { findUnique: async () => subscription },
    };
    const context = { switchToHttp: () => ({ getRequest: () => ({ params, user: { tenantId: 't1' } }) }), getHandler: () => run, getClass: () => controller } as any;
    return new SubscriptionActiveGuard(prisma as any, new Reflector()).canActivate(context);
  };
  const live = { status: 'ACTIVE', expiryDate: null };

  it('allows an active restaurant', async () => {
    assert.equal(await run({ restaurantId: 'r1' }, { id: 'r1' }, live), true);
  });

  it('rejects an expired restaurant with a SUBSCRIPTION_INACTIVE error', async () => {
    await assert.rejects(run({ restaurantId: 'r1' }, { id: 'r1' }, { status: 'EXPIRED', expiryDate: null }), (err: any) => {
      assert.ok(err instanceof ForbiddenException);
      assert.equal((err.getResponse() as { error: string }).error, 'SUBSCRIPTION_INACTIVE');
      return true;
    });
  });

  it('rejects a restaurant that has no subscription row', async () => {
    await assert.rejects(run({ restaurantId: 'r1' }, { id: 'r1' }, null), ForbiddenException);
  });

  it('lets a restaurant with no plan use a controller marked AllowWithoutPlan, but not an expired one', async () => {
    assert.equal(await run({ restaurantId: 'r1' }, { id: 'r1' }, null, OpenController), true);
    await assert.rejects(run({ restaurantId: 'r1' }, { id: 'r1' }, { status: 'EXPIRED', expiryDate: null }, OpenController), ForbiddenException);
  });

  it('leaves another tenant\'s restaurant to the route, which answers 404', async () => {
    assert.equal(await run({ restaurantId: 'r9' }, null, null), true);
  });

  it('passes routes that have no restaurantId', async () => {
    assert.equal(await run({}, null, null), true);
  });
});
