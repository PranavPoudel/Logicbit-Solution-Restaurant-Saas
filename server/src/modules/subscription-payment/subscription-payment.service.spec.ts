import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { SubscriptionPaymentService } from './subscription-payment.service';
import { SubscriptionPaymentProvider } from './subscription-payment-provider.interface';
import { CardSubscriptionProvider, PayPaySubscriptionProvider } from './providers/future-subscription-providers.stub';

const fakeGateway = (methodName: 'PAYPAY' | 'CARD'): SubscriptionPaymentProvider => ({
  methodName,
  createCheckout: async ({ paymentId }) => ({ redirectUrl: `https://gateway.test/${paymentId}`, providerReference: `ref_${paymentId}` }),
  verifyWebhook: async (payload) => ({ paymentId: payload.paymentId, success: payload.success }),
});

function setup(providers: [any, any] = [fakeGateway('PAYPAY'), fakeGateway('CARD')], method = 'PAYPAY') {
  const payments: any[] = [{ id: 'p1', method, status: 'PENDING', restaurantId: 'r1', planId: 'plan1' }];
  const prisma: any = {
    restaurant: { findFirst: async () => ({ id: 'r1', currencyCode: 'NPR' }) },
    subscriptionPlan: { findFirst: async () => ({ id: 'plan1', name: 'Pro', price: 100 }) },
    subscriptionPayment: {
      create: async ({ data }: any) => {
        const row = { id: `p${payments.length + 1}`, status: 'PENDING', ...data };
        payments.push(row);
        return row;
      },
      update: async ({ where, data }: any) => Object.assign(payments.find((p) => p.id === where.id), data),
      delete: async ({ where }: any) => void payments.splice(payments.findIndex((p) => p.id === where.id), 1),
      findUnique: async ({ where }: any) => {
        const row = payments.find((p) => p.id === where.id);
        return row && { ...row };
      },
      updateMany: async ({ where, data }: any) => {
        const row = payments.find((p) => p.id === where.id);
        if (!row || row.status !== where.status) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      },
    },
  };
  const renewals: unknown[][] = [];
  const subscriptions: any = { renewSubscription: async (...args: unknown[]) => void renewals.push(args) };
  return { service: new SubscriptionPaymentService(prisma, subscriptions, providers[0], providers[1]), payments, renewals };
}

const paid = { paymentId: 'p1', success: true };
const checkout = { planId: 'plan1', method: 'PAYPAY' as const };

describe('SubscriptionPaymentService.handleWebhook', () => {
  it('marks the payment paid and renews once, even if the gateway repeats the webhook', async () => {
    const { service, payments, renewals } = setup();
    assert.deepEqual(await service.handleWebhook('paypay', paid), { status: 'paid' });
    assert.deepEqual(await service.handleWebhook('paypay', paid), { status: 'already_processed' });
    assert.equal(payments[0].status, 'PAID');
    assert.equal(renewals.length, 1);
  });

  it('renews once when two webhooks arrive at the same time', async () => {
    const { service, renewals } = setup();
    await Promise.all([service.handleWebhook('paypay', paid), service.handleWebhook('paypay', paid)]);
    assert.equal(renewals.length, 1);
  });

  it('marks a failed payment failed and never renews', async () => {
    const { service, payments, renewals } = setup();
    assert.deepEqual(await service.handleWebhook('paypay', { paymentId: 'p1', success: false }), { status: 'failed' });
    assert.equal(payments[0].status, 'FAILED');
    assert.equal(renewals.length, 0);
  });

  it('rejects a webhook sent to the wrong gateway', async () => {
    const { service, renewals } = setup(undefined, 'CARD');
    await assert.rejects(service.handleWebhook('paypay', paid), NotFoundException);
    assert.equal(renewals.length, 0);
  });
});

describe('SubscriptionPaymentService.createCheckout', () => {
  it('records the gateway reference and returns its redirect URL', async () => {
    const { service, payments } = setup();
    const result = await service.createCheckout('t1', 'r1', checkout);
    assert.equal(result.redirectUrl, `https://gateway.test/${result.paymentId}`);
    assert.equal(payments.find((p) => p.id === result.paymentId).providerReference, `ref_${result.paymentId}`);
  });

  it('refuses and leaves no payment behind while the real gateways are not configured', async () => {
    const { service, payments, renewals } = setup([new PayPaySubscriptionProvider(), new CardSubscriptionProvider()]);
    await assert.rejects(service.createCheckout('t1', 'r1', checkout), ServiceUnavailableException);
    assert.equal(payments.length, 1);
    await assert.rejects(service.handleWebhook('paypay', paid), ServiceUnavailableException);
    assert.equal(renewals.length, 0);
  });
});
