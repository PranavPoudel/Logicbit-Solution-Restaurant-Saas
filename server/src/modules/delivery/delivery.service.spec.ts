import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException } from '@nestjs/common';
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
