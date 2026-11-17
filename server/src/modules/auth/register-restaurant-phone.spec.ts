import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { AuthService } from './auth.service';

// The kitchen phone and city typed at sign-up belong to the restaurant, so the storefront's Call us and the home page's city list can use them.

describe('register: restaurant phone and city', () => {
  const signUp = async (extra: object) => {
    const created: Record<string, any> = {};
    const tx = {
      tenant: { create: async () => ({ id: 'tenant-12345678', name: 'T' }) },
      role: { create: async () => ({ id: 'role-1' }) },
      user: { create: async ({ data }: any) => ((created.user = data), { id: 'u1', ...data }) },
      userRole: { create: async () => ({}) },
      restaurant: { create: async ({ data }: any) => ((created.restaurant = data), { id: 'r1', name: data.name }) },
    };
    const security = {
      normalizeEmail: (e: string) => e.toLowerCase(),
      findByEmail: async () => null,
      audit: () => undefined,
      sendCodeInBackground: () => undefined,
      requireVerification: false,
    };
    const service = new AuthService({ $transaction: (fn: any) => fn(tx) } as any, null as any, null as any, security as any);

    await service.register({ name: 'Owner', email: 'o@x.test', password: 'password1', phone: '090-1234-5678', restaurantName: 'Namaste', restaurantAddress: '1-2-3 Otsukacho', acceptTerms: true, ...extra } as any);
    return created;
  };

  it('saves the phone on the restaurant as well as on the owner', async () => {
    const created = await signUp({});
    assert.equal(created.restaurant.phone, '090-1234-5678');
    assert.equal(created.user.phone, '090-1234-5678');
  });

  it('saves the city on the restaurant, trimmed, and leaves it empty when none is given', async () => {
    assert.equal((await signUp({ city: ' Miyazaki ' })).restaurant.city, 'Miyazaki');
    assert.equal((await signUp({})).restaurant.city, undefined);
  });
});
