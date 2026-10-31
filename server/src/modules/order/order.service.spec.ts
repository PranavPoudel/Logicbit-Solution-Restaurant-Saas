import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { NotFoundException } from '@nestjs/common';
import { canMoveOrderStatus, deliveryBlockedReason, OrderService, ownDeliveryBlockedReason, refundBlockedReason } from './order.service';

describe('ownDeliveryBlockedReason', () => {
  const waiting = { orderType: 'DELIVERY', deliveryHandledBy: 'THIRD_PARTY', delivery: null };

  it('allows switching a partner order nobody has accepted', () => {
    assert.equal(ownDeliveryBlockedReason(waiting), null);
    assert.equal(ownDeliveryBlockedReason({ ...waiting, delivery: { deliveryPersonId: null, provider: null } }), null);
  });

  it('blocks once a rider or an external courier has taken it', () => {
    assert.ok(ownDeliveryBlockedReason({ ...waiting, delivery: { deliveryPersonId: 'r1' } }));
    assert.ok(ownDeliveryBlockedReason({ ...waiting, delivery: { provider: 'uber' } }));
  });

  it('blocks pickup orders and orders already on own riders', () => {
    assert.ok(ownDeliveryBlockedReason({ ...waiting, orderType: 'PICKUP' }));
    assert.ok(ownDeliveryBlockedReason({ ...waiting, deliveryHandledBy: 'SELF_DELIVERY' }));
  });
});

describe('deliveryBlockedReason', () => {
  const partner = { orderType: 'DELIVERY', deliveryHandledBy: 'THIRD_PARTY', delivery: null };

  it('holds a partner order until a delivery partner has accepted', () => {
    assert.ok(deliveryBlockedReason(partner, 'OUT_FOR_DELIVERY'));
    assert.ok(deliveryBlockedReason(partner, 'DELIVERED'));
    assert.equal(deliveryBlockedReason({ ...partner, delivery: { deliveryPersonId: null } }, 'OUT_FOR_DELIVERY') !== null, true);
  });

  it('lets a partner order go out once a partner is assigned', () => {
    assert.equal(deliveryBlockedReason({ ...partner, delivery: { deliveryPersonId: 'r1' } }, 'OUT_FOR_DELIVERY'), null);
  });

  it('treats an external provider as an assigned partner', () => {
    assert.equal(deliveryBlockedReason({ ...partner, delivery: { provider: 'generic' } }, 'OUT_FOR_DELIVERY'), null);
  });

  it('holds mark-delivered until the delivery partner has delivered', () => {
    const assigned = { ...partner, delivery: { deliveryPersonId: 'r1', status: 'ON_THE_WAY' } };
    assert.ok(deliveryBlockedReason(assigned, 'DELIVERED'));
    assert.ok(deliveryBlockedReason(assigned, 'COMPLETED'));
    assert.equal(deliveryBlockedReason({ ...assigned, delivery: { deliveryPersonId: 'r1', status: 'DELIVERED' } }, 'DELIVERED'), null);
  });

  it('never holds self-delivery, pickup or earlier steps', () => {
    assert.equal(deliveryBlockedReason({ ...partner, deliveryHandledBy: 'SELF_DELIVERY' }, 'OUT_FOR_DELIVERY'), null);
    assert.equal(deliveryBlockedReason({ ...partner, orderType: 'PICKUP' }, 'DELIVERED'), null);
    assert.equal(deliveryBlockedReason(partner, 'READY'), null);
  });
});

describe('refundBlockedReason', () => {
  const paid = { paymentStatus: 'PAID', total: 100, refund: null };

  it('allows a full or partial refund on a paid order', () => {
    assert.equal(refundBlockedReason(paid, 100), null);
    assert.equal(refundBlockedReason(paid, 25.5), null);
  });

  it('blocks unpaid, over-total and already refunded orders', () => {
    assert.ok(refundBlockedReason({ ...paid, paymentStatus: 'UNPAID' }, 10));
    assert.ok(refundBlockedReason(paid, 100.01));
    assert.ok(refundBlockedReason({ ...paid, paymentStatus: 'REFUNDED' }, 10));
    assert.ok(refundBlockedReason({ ...paid, refund: { status: 'PROCESSED' } }, 10));
  });

  it('lets an old pending refund record be completed', () => {
    assert.equal(refundBlockedReason({ ...paid, refund: { status: 'PENDING' } }, 100), null);
  });
});

describe('canMoveOrderStatus', () => {
  it('allows the normal forward steps', () => {
    assert.ok(canMoveOrderStatus('PENDING', 'ACCEPTED'));
    assert.ok(canMoveOrderStatus('ACCEPTED', 'PREPARING'));
    assert.ok(canMoveOrderStatus('PREPARING', 'READY'));
    assert.ok(canMoveOrderStatus('READY', 'DELIVERED'));
    assert.ok(canMoveOrderStatus('READY', 'OUT_FOR_DELIVERY'));
    assert.ok(canMoveOrderStatus('OUT_FOR_DELIVERY', 'DELIVERED'));
  });

  it('rejects skipping ahead, going back and cancelling through the status route', () => {
    assert.ok(!canMoveOrderStatus('PENDING', 'DELIVERED'));
    assert.ok(!canMoveOrderStatus('ACCEPTED', 'READY'));
    assert.ok(!canMoveOrderStatus('READY', 'PREPARING'));
    assert.ok(!canMoveOrderStatus('PENDING', 'CANCELLED'));
  });
});

describe('OrderService.cancel scoping', () => {
  const order = { id: 'o1', status: 'PENDING', tenantId: 't1', restaurantId: 'r1' };
  const service = new OrderService({ order: { findUnique: async () => order } } as any, null as any, null as any, null as any, null as any, null as any);

  it('hides an order that belongs to another tenant', async () => {
    await assert.rejects(
      service.cancel('RESTAURANT', 'u2', 'o1', {}, { tenantId: 't2', restaurantId: 'r2' }),
      NotFoundException,
    );
  });

  it('hides an order from a different restaurant of the same tenant', async () => {
    await assert.rejects(
      service.cancel('RESTAURANT', 'u1', 'o1', {}, { tenantId: 't1', restaurantId: 'r9' }),
      NotFoundException,
    );
  });
});
