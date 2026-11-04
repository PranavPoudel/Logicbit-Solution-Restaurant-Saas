import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { canMoveOrderStatus, deliveryBlockedReason, OrderService, ownDeliveryBlockedReason, paymentBlockedReason, refundBlockedReason, refundGoesThroughPayPay, refundMethodBlockedReason } from './order.service';

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

describe('refundGoesThroughPayPay', () => {
  it('sends the money through PayPay only for orders the customer paid with PayPay', () => {
    assert.equal(refundGoesThroughPayPay({ paymentMethod: 'PAYPAY' }, 'PAYPAY'), true);
    assert.equal(refundGoesThroughPayPay({ paymentMethod: 'COD' }, 'PAYPAY'), false);
    assert.equal(refundGoesThroughPayPay({ paymentMethod: 'PAYPAY' }, 'CASH'), false);
  });
});

describe('refundMethodBlockedReason', () => {
  it('lets any order be paid back by hand, including by PayPay on a cash order', () => {
    for (const method of ['CASH', 'BANK_TRANSFER', 'OTHER', 'PAYPAY']) assert.equal(refundMethodBlockedReason({ paymentMethod: 'COD' }, method), null);
    for (const method of ['CASH', 'BANK_TRANSFER', 'OTHER']) assert.equal(refundMethodBlockedReason({ paymentMethod: 'PAYPAY' }, method), null);
  });

  it('stops a second refund while PayPay is still working on the first', () => {
    const waiting = { paymentMethod: 'PAYPAY', refund: { method: 'PAYPAY', status: 'PENDING' } };
    assert.ok(refundMethodBlockedReason(waiting, 'CASH'));
    assert.equal(refundMethodBlockedReason(waiting, 'PAYPAY'), null);
    assert.equal(refundMethodBlockedReason({ ...waiting, refund: { method: 'PAYPAY', status: 'FAILED' } }, 'CASH'), null);
  });

  it('only accepts whole yen when PayPay sends the money back itself', () => {
    const paypayOrder = { paymentMethod: 'PAYPAY' };
    assert.match(refundMethodBlockedReason(paypayOrder, 'PAYPAY', 100.5)!, /whole number of yen/);
    assert.equal(refundMethodBlockedReason(paypayOrder, 'PAYPAY', 100), null);
    assert.equal(refundMethodBlockedReason(paypayOrder, 'CASH', 100.5), null);
    assert.equal(refundMethodBlockedReason({ paymentMethod: 'COD' }, 'PAYPAY', 100.5), null);
  });
});

describe('OrderService.issueRefund', () => {
  type Saved = Record<string, any>;
  const build = (over: Record<string, any> = {}, payResult: any = { status: 'COMPLETED', providerReference: 'pp-ref' }) => {
    const order = { id: 'o1', orderNumber: 'LB-1', status: 'DELIVERED', customerId: 'c1', paymentStatus: 'PAID', paymentMethod: 'PAYPAY', total: 100, refund: null, ...over };
    const log: { refund?: Saved; paymentStatus?: string; emailed?: any[]; payCalls: any[] } = { payCalls: [] };
    const tx = {
      refund: { upsert: async ({ create }: any) => (log.refund = create) },
      order: { update: async ({ data }: any) => (log.paymentStatus = data.paymentStatus) },
      orderStatusHistory: { create: async () => null },
    };
    const prisma = {
      order: { findFirst: async () => order },
      refund: { upsert: async ({ create }: any) => (log.refund = create) },
      $transaction: async (fn: any) => fn(tx),
    };
    const payments = { refund: async (...args: any[]) => (log.payCalls.push(args), payResult) };
    const notifications = { notifyRefundIssued: async (...args: any[]) => ((log.emailed ??= []).push(args), null) };
    const service = new OrderService(prisma as any, null as any, payments as any, notifications as any, { log: async () => null } as any, null as any);
    return { service, log };
  };
  const dto = (over: Record<string, any> = {}) => ({ amount: 40, reason: 'Missing item', method: 'BANK_TRANSFER', reference: ' TX-77 ', ...over }) as any;

  it('records a hand-paid refund with its method and reference and emails the customer', async () => {
    const { service, log } = build();
    await service.issueRefund('t1', 'r1', 'o1', dto(), 'u1');
    assert.equal(log.refund?.status, 'PROCESSED');
    assert.equal(log.refund?.method, 'BANK_TRANSFER');
    assert.equal(log.refund?.reference, 'TX-77');
    assert.equal(log.paymentStatus, 'REFUNDED');
    assert.equal(log.payCalls.length, 0);
    assert.deepEqual(log.emailed?.[0].slice(4), ['Missing item', 'BANK_TRANSFER', 'TX-77']);
  });

  it('sends a PayPay refund through PayPay and counts it once PayPay completes it', async () => {
    const { service, log } = build();
    await service.issueRefund('t1', 'r1', 'o1', dto({ method: 'PAYPAY', reference: undefined }), 'u1');
    assert.deepEqual(log.payCalls[0], ['PAYPAY', 'o1', 40, undefined]);
    assert.equal(log.refund?.status, 'PROCESSED');
    assert.equal(log.refund?.reference, 'pp-ref');
    assert.equal(log.paymentStatus, 'REFUNDED');
  });

  it('leaves the order paid and reports the reason when PayPay says no', async () => {
    const { service, log } = build({}, { status: 'FAILED', message: 'INVALID_REFUND_AMOUNT' });
    await assert.rejects(service.issueRefund('t1', 'r1', 'o1', dto({ method: 'PAYPAY' }), 'u1'), BadRequestException);
    assert.equal(log.refund?.status, 'FAILED');
    assert.equal(log.refund?.failureReason, 'INVALID_REFUND_AMOUNT');
    assert.equal(log.paymentStatus, undefined);
    assert.equal(log.emailed, undefined);
  });

  it('keeps a refund PayPay is still working on pending, and resumes it on retry', async () => {
    const first = build({}, { status: 'PENDING', providerReference: 'pp-ref' });
    await first.service.issueRefund('t1', 'r1', 'o1', dto({ method: 'PAYPAY' }), 'u1');
    assert.equal(first.log.refund?.status, 'PENDING');
    assert.equal(first.log.paymentStatus, undefined);

    const retry = build({ refund: { method: 'PAYPAY', status: 'PENDING', reference: 'pp-ref' } });
    await retry.service.issueRefund('t1', 'r1', 'o1', dto({ method: 'PAYPAY' }), 'u1');
    assert.equal(retry.log.payCalls[0][3], 'pp-ref');
    assert.equal(retry.log.refund?.status, 'PROCESSED');
  });

  it('records a PayPay payback on a cash order by hand, without calling PayPay', async () => {
    const { service, log } = build({ paymentMethod: 'COD' });
    await service.issueRefund('t1', 'r1', 'o1', dto({ method: 'PAYPAY', reference: 'PP-5' }), 'u1');
    assert.equal(log.payCalls.length, 0);
    assert.equal(log.refund?.status, 'PROCESSED');
    assert.equal(log.refund?.method, 'PAYPAY');
    assert.equal(log.refund?.reference, 'PP-5');
    assert.equal(log.paymentStatus, 'REFUNDED');
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

describe('paymentBlockedReason', () => {
  it('stops an unpaid online order from being accepted', () => {
    assert.match(paymentBlockedReason({ paymentMethod: 'PAYPAY', paymentStatus: 'UNPAID' }, 'ACCEPTED')!, /pay/i);
  });

  it('lets paid online orders, cash orders and cancellations through', () => {
    assert.equal(paymentBlockedReason({ paymentMethod: 'PAYPAY', paymentStatus: 'PAID' }, 'ACCEPTED'), null);
    assert.equal(paymentBlockedReason({ paymentMethod: 'COD', paymentStatus: 'UNPAID' }, 'ACCEPTED'), null);
    assert.equal(paymentBlockedReason({ paymentMethod: 'PAYPAY', paymentStatus: 'UNPAID' }, 'CANCELLED'), null);
  });
});

describe('OrderService.confirmPayPayPayment', () => {
  const ORDER_ID = '8ef0080a-5c27-4b4e-bd21-1407858d8288';
  const paypayOrder = { paymentMethod: 'PAYPAY', paymentStatus: 'UNPAID', total: 1200, currencyCode: 'JPY', orderNumber: 'ORD-1', tenantId: 't1', restaurantId: 'r1' };

  function build(order: any, check: any, updated = 1) {
    const sent: unknown[] = [];
    const logged: unknown[] = [];
    const asked: string[] = [];
    const prisma = {
      order: { findUnique: async () => order, updateMany: async () => ({ count: updated }) },
      user: { findMany: async () => [{ email: 'owner@test.com' }] },
    };
    const payments = { checkPayment: async (_m: string, id: string) => (asked.push(id), check) };
    const notifications = { send: async (n: unknown) => sent.push(n) };
    const service = new OrderService(prisma as any, null as any, payments as any, notifications as any, { log: async (l: unknown) => logged.push(l) } as any, null as any);
    return { service, sent, logged, asked };
  }

  it('marks the order paid and tells the restaurant once PayPay confirms the full amount', async () => {
    const { service, sent, logged } = build(paypayOrder, { paid: true, amount: 1200, currency: 'JPY' });
    assert.equal(await service.confirmPayPayPayment(ORDER_ID), true);
    assert.equal(sent.length, 1);
    assert.equal(logged.length, 1);
  });

  it('does not mark it paid when PayPay reports a different amount or currency', async () => {
    const { service, sent } = build(paypayOrder, { paid: true, amount: 100, currency: 'JPY' });
    assert.equal(await service.confirmPayPayPayment(ORDER_ID), false);
    assert.equal(sent.length, 0);
    assert.equal(await build(paypayOrder, { paid: true, amount: 1200, currency: 'USD' }).service.confirmPayPayPayment(ORDER_ID), false);
  });

  it('does not mark it paid while PayPay says it is unpaid', async () => {
    const { service, sent } = build(paypayOrder, { paid: false });
    assert.equal(await service.confirmPayPayPayment(ORDER_ID), false);
    assert.equal(sent.length, 0);
  });

  it('acts only once when two confirmations arrive together', async () => {
    const { service, sent } = build(paypayOrder, { paid: true, amount: 1200, currency: 'JPY' }, 0);
    assert.equal(await service.confirmPayPayPayment(ORDER_ID), true);
    assert.equal(sent.length, 0);
  });

  it('does not ask PayPay about orders that are already paid, not PayPay, or not real', async () => {
    const paid = build({ ...paypayOrder, paymentStatus: 'PAID' }, { paid: true });
    assert.equal(await paid.service.confirmPayPayPayment(ORDER_ID), true);
    const cash = build({ ...paypayOrder, paymentMethod: 'COD' }, { paid: true });
    assert.equal(await cash.service.confirmPayPayPayment(ORDER_ID), false);
    const junk = build(paypayOrder, { paid: true });
    assert.equal(await junk.service.confirmPayPayPayment('not-a-uuid'), false);
    assert.equal(paid.asked.length + cash.asked.length + junk.asked.length, 0);
  });
});
