import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { AuthService } from './auth.service';

// The kitchen phone and city typed at sign-up belong to the restaurant, so the storefront's Call us and the home page's city list can use them.

const CITIES = [
  { name: 'Tokyo', nameJa: '東京', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Miyazaki', nameJa: '宮崎', latitude: 31.9111, longitude: 131.4239 },
];

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
    const service = new AuthService({ $transaction: (fn: any) => fn(tx), city: { findMany: async () => CITIES } } as any, null as any, null as any, security as any);

    await service.register({ name: 'Owner', email: 'o@x.test', password: 'password1', phone: '090-1234-5678', restaurantName: 'Namaste', restaurantAddress: '1-2-3 Otsukacho', acceptTerms: true, ...extra } as any);
    return created;
  };

  it('saves the phone on the restaurant as well as on the owner', async () => {
    const created = await signUp({});
    assert.equal(created.restaurant.phone, '090-1234-5678');
    assert.equal(created.user.phone, '090-1234-5678');
  });

  it('saves the listed city on the restaurant, with the spelling of the Cities table, and leaves it empty when none can be told', async () => {
    assert.equal((await signUp({ city: ' miyazaki ' })).restaurant.city, 'Miyazaki');
    assert.equal((await signUp({ city: '宮崎' })).restaurant.city, 'Miyazaki');
    assert.equal((await signUp({})).restaurant.city, undefined);
  });

  it('takes the nearest listed city from the pin instead of the text an address lookup returned', async () => {
    assert.equal((await signUp({ city: 'Utsukushigaoka, Aoba Ward, Yokohama', latitude: 35.5, longitude: 139.5 })).restaurant.city, 'Tokyo');
    assert.equal((await signUp({ latitude: 35.69, longitude: 139.7 })).restaurant.city, 'Tokyo');
  });

  it('leaves the city empty when the pin is far from every listed city', async () => {
    assert.equal((await signUp({ latitude: 27.7172, longitude: 85.324 })).restaurant.city, undefined);
  });
});
