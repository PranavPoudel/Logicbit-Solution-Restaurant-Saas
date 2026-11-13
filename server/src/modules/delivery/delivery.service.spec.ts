import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { canMoveDeliveryStatus, DeliveryService } from './delivery.service';

describe('canMoveDeliveryStatus', () => {
  it('allows the normal rider steps and failing an active delivery', () => {
    assert.ok(canMoveDeliveryStatus('ASSIGNED', 'PICKED_UP'));
    assert.ok(canMoveDeliveryStatus('PICKED_UP', 'ON_THE_WAY'));
    assert.ok(canMoveDeliveryStatus('ON_THE_WAY', 'DELIVERED'));
    assert.ok(canMoveDeliveryStatus('PICKED_UP', 'FAILED'));
  });

  it('rejects skipping steps and changing a finished delivery', () => {
    assert.ok(!canMoveDeliveryStatus('ASSIGNED', 'DELIVERED'));
    assert.ok(!canMoveDeliveryStatus('ASSIGNED', 'ON_THE_WAY'));
    assert.ok(!canMoveDeliveryStatus('DELIVERED', 'ON_THE_WAY'));
    assert.ok(!canMoveDeliveryStatus('FAILED', 'PICKED_UP'));
  });
});

describe('DeliveryService.applyExternalEvent', () => {
  const build = (found: { orderId: string } | null, order: unknown) => {
    const calls: { lookup?: unknown; updated?: unknown } = {};
    const prisma = {
      delivery: {
        findFirst: async (args: unknown) => ((calls.lookup = args), found),
        update: async (args: unknown) => ((calls.updated = args), {}),
      },
      order: { findUnique: async () => order, update: async () => ({}) },
      orderStatusHistory: { create: async () => ({}) },
      $transaction: async () => [],
    };
    const notifications = { notifyOrderUpdate: async () => undefined };
    return { service: new DeliveryService(prisma as any, null as any, null as any, notifications as any), calls };
  };
  const assigned = { id: 'o1', status: 'READY', orderType: 'DELIVERY', deliveryHandledBy: 'THIRD_PARTY', orderNumber: 'ORD-1', delivery: { status: 'ASSIGNED', provider: 'uber' } };

  it('finds the order by the provider delivery id when the provider did not send our order id', async () => {
    const { service, calls } = build({ orderId: 'o1' }, assigned);
    const result = await service.applyExternalEvent('uber', { event: 'PICKED_UP', externalRef: 'del_1' });
    assert.equal(result.success, true);
    assert.deepEqual(calls.lookup, { where: { externalRef: 'del_1' }, select: { orderId: true } });
  });

  it('does not look the delivery up when the order id is given', async () => {
    const { service, calls } = build(null, assigned);
    await service.applyExternalEvent('uber', { event: 'PICKED_UP', orderId: 'o1', externalRef: 'del_1' });
    assert.equal(calls.lookup, undefined);
  });

  it('never reaches another restaurant\'s order, even when the order id or delivery id is known', async () => {
    const elsewhere = { ...assigned, restaurantId: 'other-restaurant' };
    await assert.rejects(build(null, elsewhere).service.applyExternalEvent('uber', { event: 'PICKED_UP', orderId: 'o1' }, 'mine'), NotFoundException);
    const { service, calls } = build({ orderId: 'o1' }, elsewhere);
    await assert.rejects(service.applyExternalEvent('uber', { event: 'PICKED_UP', externalRef: 'del_1' }, 'mine'), NotFoundException);
    assert.deepEqual(calls.lookup, { where: { externalRef: 'del_1', order: { restaurantId: 'mine' } }, select: { orderId: true } });
  });

  it('works on the restaurant\'s own order', async () => {
    const own = { ...assigned, restaurantId: 'mine' };
    const result = await build(null, own).service.applyExternalEvent('uber', { event: 'PICKED_UP', orderId: 'o1' }, 'mine');
    assert.equal(result.success, true);
  });

  it('answers not found when the delivery id is unknown, or nothing identifies the order', async () => {
    await assert.rejects(build(null, assigned).service.applyExternalEvent('uber', { event: 'PICKED_UP', externalRef: 'del_x' }), NotFoundException);
    await assert.rejects(build(null, assigned).service.applyExternalEvent('uber', { event: 'PICKED_UP' }), NotFoundException);
  });
});

describe('DeliveryService.acceptOrder', () => {
  const build = (order: unknown, claimed = 1) => {
    const prisma = {
      order: { findUnique: async () => order },
      delivery: {
        updateMany: async () => ({ count: claimed }),
        create: async () => {
          throw Object.assign(new Error('unique'), { code: 'P2002' });
        },
        findUnique: async () => ({ status: 'ASSIGNED' }),
      },
    };
    return new DeliveryService(prisma as any, null as any, null as any, null as any);
  };
  const ready = { status: 'READY', orderType: 'DELIVERY', deliveryHandledBy: null };

  it('refuses when another rider claimed the order first', async () => {
    await assert.rejects(build({ ...ready, delivery: { status: 'UNASSIGNED' } }, 0).acceptOrder('r1', 'o1'), BadRequestException);
  });

  it('refuses when a concurrent create hits the unique order constraint', async () => {
    await assert.rejects(build({ ...ready, delivery: null }).acceptOrder('r1', 'o1'), BadRequestException);
  });

  it('refuses pickup orders and restaurant self-delivery', async () => {
    await assert.rejects(build({ ...ready, orderType: 'PICKUP', delivery: null }).acceptOrder('r1', 'o1'), BadRequestException);
    await assert.rejects(build({ ...ready, deliveryHandledBy: 'SELF_DELIVERY', delivery: null }).acceptOrder('r1', 'o1'), BadRequestException);
  });

  it('assigns a free order', async () => {
    const result = await build({ ...ready, delivery: { status: 'UNASSIGNED' } }).acceptOrder('r1', 'o1');
    assert.equal(result.success, true);
  });
});
