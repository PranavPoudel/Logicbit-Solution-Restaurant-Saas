import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderService, PAYMENT_PAGE_GONE_MINUTES, UNPAID_ORDER_MINUTES } from './order.service';

const ORDER_ID = '8ef0080a-5c27-4b4e-bd21-1407858d8288';
const MINUTE = 60000;

const unpaidCard = {
  id: ORDER_ID,
  customerId: 'c1',
  tenantId: 't1',
  restaurantId: 'r1',
  orderNumber: 'ORD-9',
  paymentMethod: 'CREDIT_CARD',
  paymentStatus: 'UNPAID',
  status: 'PENDING',
  total: 1200,
  currencyCode: 'JPY',
  paymentReference: 'cs_old',
  createdAt: new Date(Date.now() - 20 * MINUTE),
};

interface Setup {
  order?: any;
  stale?: any[];
  resume?: any;
  cancelPayment?: { paid: boolean } | Error;
  check?: any;
}

function build({ order = unpaidCard, stale = [], resume = { redirectUrl: 'https://pay.test/x', providerReference: 'cs_old' }, cancelPayment = { paid: false }, check = { paid: false } }: Setup = {}) {
  const updates: any[] = [];
  const history: any[] = [];
  const logged: any[] = [];
  const calls: string[] = [];
  const prisma = {
    order: {
      findUnique: async () => order,
      findMany: async () => stale,
      updateMany: async (args: any) => (updates.push(args), { count: 1 }),
      update: async (args: any) => ({ ...order, ...args.data }),
    },
    restaurant: { findUnique: async () => ({ cancellationWindowMinutes: 5 }) },
    orderStatusHistory: { create: async (a: any) => history.push(a) },
    $transaction: async (fn: any) => fn(prisma),
  };
  const payments = {
    canResume: (m: string) => m === 'CREDIT_CARD',
    resume: async () => (calls.push('resume'), resume),
    cancelPayment: async () => {
      calls.push('cancelPayment');
      if (cancelPayment instanceof Error) throw cancelPayment;
      return cancelPayment;
    },
    checkPayment: async () => (calls.push('checkPayment'), check),
  };
  const notified: unknown[] = [];
  const notifications = { notifyNewOrder: async (id: unknown) => notified.push(id) };
  const service = new OrderService(prisma as any, null as any, payments as any, notifications as any, { log: async (l: unknown) => logged.push(l) } as any, null as any);
  return { service, updates, history, logged, calls, notified };
}

describe('OrderService.payNow', () => {
  it('sends the customer to the payment page', async () => {
    const { service, calls } = build();
    assert.deepEqual(await service.payNow('c1', ORDER_ID), { success: true, paid: false, redirectUrl: 'https://pay.test/x' });
    assert.deepEqual(calls, ['resume']);
  });

  it('saves the new payment page id when the old page expired', async () => {
    const { service, updates } = build({ resume: { redirectUrl: 'https://pay.test/new', providerReference: 'cs_new' } });
    await service.payNow('c1', ORDER_ID);
    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].data, { paymentReference: 'cs_new' });
    assert.equal(updates[0].where.paymentStatus, 'UNPAID', 'a paid order is never touched');
  });

  it('does not rewrite the order when the same page is reused', async () => {
    const { service, updates } = build();
    await service.payNow('c1', ORDER_ID);
    assert.equal(updates.length, 0);
  });

  it('confirms and reports paid when the money already arrived', async () => {
    const { service, calls } = build({ resume: { paid: true }, check: { paid: true, amount: 1200, currency: 'JPY' } });
    assert.deepEqual(await service.payNow('c1', ORDER_ID), { success: true, paid: true });
    assert.ok(calls.includes('checkPayment'));
  });

  it('answers paid for an order that is already paid, without asking the gateway', async () => {
    const { service, calls } = build({ order: { ...unpaidCard, paymentStatus: 'PAID' } });
    assert.deepEqual(await service.payNow('c1', ORDER_ID), { success: true, paid: true });
    assert.deepEqual(calls, []);
  });

  it("is not available for another customer's order", async () => {
    await assert.rejects(build().service.payNow('someone-else', ORDER_ID), NotFoundException);
    await assert.rejects(build({ order: null }).service.payNow('c1', ORDER_ID), NotFoundException);
  });

  it('refuses cash orders, cancelled orders and orders the restaurant already accepted', async () => {
    for (const patch of [{ paymentMethod: 'COD' }, { status: 'CANCELLED' }, { status: 'ACCEPTED' }, { paymentMethod: 'PAYPAY' }]) {
      await assert.rejects(build({ order: { ...unpaidCard, ...patch } }).service.payNow('c1', ORDER_ID), BadRequestException);
    }
  });
});

describe('OrderService.cancel for an unpaid card order', () => {
  it('closes the payment page, then cancels, even after the 5-minute window', async () => {
    const { service, calls, history } = build({ order: { ...unpaidCard, createdAt: new Date(Date.now() - 30 * MINUTE) } });
    const result = await service.cancel('CUSTOMER', 'c1', ORDER_ID, { reason: 'Changed my mind' } as any);
    assert.equal(result.success, true);
    assert.deepEqual(calls, ['cancelPayment']);
    assert.equal(history.length, 1);
  });

  it('does not cancel when the payment landed meanwhile: it confirms it and says so', async () => {
    const { service, calls, history } = build({ cancelPayment: { paid: true }, check: { paid: true, amount: 1200, currency: 'JPY' } });
    await assert.rejects(service.cancel('CUSTOMER', 'c1', ORDER_ID, {} as any), /just went through/);
    assert.ok(calls.includes('checkPayment'));
    assert.equal(history.length, 0);
  });

  it('does not cancel when the payment page could not be closed', async () => {
    const { service, history } = build({ cancelPayment: new Error('Stripe could not close the payment page') });
    await assert.rejects(service.cancel('CUSTOMER', 'c1', ORDER_ID, {} as any), /could not close/);
    assert.equal(history.length, 0);
  });

  it('keeps the cancellation window for orders the restaurant can already see', async () => {
    const cod = { ...unpaidCard, paymentMethod: 'COD', createdAt: new Date(Date.now() - 30 * MINUTE) };
    await assert.rejects(build({ order: cod }).service.cancel('CUSTOMER', 'c1', ORDER_ID, {} as any), ForbiddenException);
  });
});

describe('OrderService.cancelExpiredUnpaidOrders', () => {
  const stale = [{ id: ORDER_ID, orderNumber: 'ORD-9', tenantId: 't1', restaurantId: 'r1', paymentMethod: 'CREDIT_CARD', createdAt: new Date(Date.now() - 40 * MINUTE) }];

  it('only looks at card orders nobody paid for, older than the limit', async () => {
    let where: any;
    const { service } = build();
    (service as any).prisma.order.findMany = async (args: any) => ((where = args.where), []);
    const now = new Date();
    await service.cancelExpiredUnpaidOrders(now);
    assert.equal(where.paymentMethod, 'CREDIT_CARD');
    assert.equal(where.paymentStatus, 'UNPAID');
    assert.equal(where.status, 'PENDING');
    assert.equal(where.createdAt.lt.getTime(), now.getTime() - UNPAID_ORDER_MINUTES * MINUTE);
  });

  it('closes the payment page, then cancels the order as the system', async () => {
    const { service, calls, updates, history, logged } = build({ stale });
    assert.equal(await service.cancelExpiredUnpaidOrders(), 1);
    assert.deepEqual(calls, ['checkPayment', 'cancelPayment']);
    assert.equal(updates[0].data.status, 'CANCELLED');
    assert.equal(updates[0].data.cancelledBy, 'SYSTEM');
    assert.equal(updates[0].where.paymentStatus, 'UNPAID', 'never cancels an order that has just been paid');
    assert.equal(history.length, 1);
    assert.equal(logged.length, 1);
  });

  it('confirms a late payment instead of cancelling', async () => {
    const { service, updates } = build({ stale, check: { paid: true, amount: 1200, currency: 'JPY' } });
    assert.equal(await service.cancelExpiredUnpaidOrders(), 0);
    assert.ok(!updates.some((u) => u.data.status === 'CANCELLED'));
  });

  it('confirms instead of cancelling when the money lands while the page is being closed', async () => {
    const { service, updates, calls } = build({ stale, cancelPayment: { paid: true } });
    assert.equal(await service.cancelExpiredUnpaidOrders(), 0);
    assert.ok(!updates.some((u) => u.data.status === 'CANCELLED'));
    assert.deepEqual(calls.filter((c) => c === 'checkPayment').length, 2);
  });

  it('leaves an order alone, and carries on, when the payment page cannot be closed', async () => {
    const { service, updates } = build({ stale, cancelPayment: new Error('network down') });
    assert.equal(await service.cancelExpiredUnpaidOrders(), 0);
    assert.ok(!updates.some((u) => u.data?.status === 'CANCELLED'));
  });
});

describe('a payment that arrives for a cancelled order', () => {
  const paidCheck = { paid: true, amount: 1200, currency: 'JPY' };

  it('is recorded as paid so it can be refunded, without a new-order email to the restaurant', async () => {
    const { service, notified, logged, updates } = build({ order: { ...unpaidCard, status: 'CANCELLED' }, check: paidCheck });
    assert.equal(await service.confirmOnlinePayment(ORDER_ID), true);
    assert.equal(updates.length, 1, 'the payment status is updated');
    assert.equal(notified.length, 0, 'the restaurant is not told about an order it must not cook');
    assert.equal(logged[0].action, 'ORDER_PAID_AFTER_CANCEL');
    assert.match(logged[0].description, /Refund it/);
  });

  it('still emails the restaurant for a normal paid order', async () => {
    const { service, notified, logged } = build({ check: paidCheck });
    assert.equal(await service.confirmOnlinePayment(ORDER_ID), true);
    assert.equal(notified.length, 1);
    assert.equal(logged[0].action, 'ORDER_PAID');
  });

  it('does not ask the gateway every time a cancelled unpaid order is viewed', async () => {
    const { service, calls } = build({ order: { ...unpaidCard, status: 'CANCELLED' } });
    (service as any).findOne = async () => ({ ...unpaidCard, status: 'CANCELLED', restaurant: {} });
    await service.findOneForCustomer('c1', ORDER_ID);
    assert.ok(!calls.includes('checkPayment'));
  });
});

describe('cancelExpiredUnpaidOrders when the payment page cannot be checked', () => {
  const stale = (minutesOld: number) => [{ id: ORDER_ID, orderNumber: 'ORD-9', tenantId: 't1', restaurantId: 'r1', paymentMethod: 'CREDIT_CARD', createdAt: new Date(Date.now() - minutesOld * MINUTE) }];

  it('waits while a page could still be open', async () => {
    const { service, updates } = build({ stale: stale(60), cancelPayment: new Error('no key') });
    assert.equal(await service.cancelExpiredUnpaidOrders(), 0);
    assert.ok(!updates.some((u) => u.data?.status === 'CANCELLED'));
  });

  it('cancels it once the order is older than any payment page can live', async () => {
    const { service, updates } = build({ stale: stale(PAYMENT_PAGE_GONE_MINUTES + 5), cancelPayment: new Error('no key') });
    assert.equal(await service.cancelExpiredUnpaidOrders(), 1);
    assert.equal(updates.find((u) => u.data?.status === 'CANCELLED')?.data.cancelledBy, 'SYSTEM');
  });

  it('looks at the newest expired orders first, so ones that keep failing cannot crowd out the rest', async () => {
    let args: any;
    const { service } = build();
    (service as any).prisma.order.findMany = async (a: any) => ((args = a), []);
    await service.cancelExpiredUnpaidOrders();
    assert.deepEqual(args.orderBy, { createdAt: 'desc' });
  });
});
