import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { ForbiddenException } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

function build() {
  const updates: any[] = [];
  const prisma = { restaurant: { updateMany: async (args: any) => (updates.push(args), { count: 1 }) } };
  const service = new RestaurantService(prisma as any, { log: async () => undefined } as any);
  (service as any).findOne = async () => ({ id: 'r1', paypayMerchantId: 'M-1', paypayApiKey: 'K-1' });
  return { service, updates };
}

describe('RestaurantService.update: payment keys are owner only', () => {
  it('staff cannot save or replace a Stripe key', async () => {
    const { service, updates } = build();
    await assert.rejects(service.update('t1', 'r1', { stripeSecretKey: 'sk_test_abc' } as any, false), ForbiddenException);
    assert.equal(updates.length, 0);
  });

  it('staff cannot replace the PayPay secret, merchant id or API key', async () => {
    const { service, updates } = build();
    await assert.rejects(service.update('t1', 'r1', { paypayApiSecret: 'secret' } as any, false), ForbiddenException);
    await assert.rejects(service.update('t1', 'r1', { paypayMerchantId: 'M-2' } as any, false), ForbiddenException);
    await assert.rejects(service.update('t1', 'r1', { paypayApiKey: 'K-2' } as any, false), ForbiddenException);
    assert.equal(updates.length, 0);
  });

  it('staff can still save other settings, even though the page re-sends the unchanged PayPay ids', async () => {
    const { service, updates } = build();
    await service.update('t1', 'r1', { description: 'New text', paypayMerchantId: 'M-1', paypayApiKey: 'K-1' } as any, false);
    assert.equal(updates.length, 1);
  });

  it('the owner can change payment keys, and the secrets are stored encrypted', async () => {
    const { service, updates } = build();
    await service.update('t1', 'r1', { stripeSecretKey: 'sk_test_abc', paypayApiSecret: 'secret' } as any, true);
    assert.match(updates[0].data.stripeSecretKey, /^enc:v1:/);
    assert.match(updates[0].data.paypayApiSecret, /^enc:v1:/);
  });
});
