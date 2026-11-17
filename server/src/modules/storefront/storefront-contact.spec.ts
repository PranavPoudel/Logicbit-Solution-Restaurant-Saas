import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { StorefrontService } from './storefront.service';

// "Call us" on the restaurant page must be a phone number, never the street address.

const ADDRESS = '1 Kitchen Street, Miyazaki';

async function contactFor(restaurantPhone: string | null, config: object | null) {
  const prisma = {
    restaurant: { findFirst: async () => ({ id: 'r1', tenantId: 't1', address: ADDRESS, phone: restaurantPhone }) },
    storefrontBanner: { findMany: async () => [] },
    storefrontConfig: { findFirst: async () => config },
    coupon: { findMany: async () => [] },
  };
  const result = await new StorefrontService(prisma as any).getPublicStorefront('r1');
  return result.data.contact;
}

describe('public storefront contact', () => {
  it('shows the restaurant phone, not its address', async () => {
    const contact = await contactFor('+81 98 000 0000', null);
    assert.equal(contact.phone, '+81 98 000 0000');
    assert.equal(contact.address, ADDRESS);
  });

  it('prefers the number set in the storefront builder, and ignores a blank one', async () => {
    assert.equal((await contactFor('+81 98 000 0000', { contactPhone: '+81 90 111 1111' })).phone, '+81 90 111 1111');
    assert.equal((await contactFor('+81 98 000 0000', { contactPhone: '' })).phone, '+81 98 000 0000');
  });
});
