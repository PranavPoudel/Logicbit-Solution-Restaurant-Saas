import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

const CITIES = [
  { name: 'Tokyo', nameJa: '東京', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Zushi', nameJa: null, latitude: 35.2955, longitude: 139.5786 },
];

function build(currentCity: string | null) {
  const updates: any[] = [];
  const prisma = {
    restaurant: { updateMany: async (args: any) => (updates.push(args), { count: 1 }) },
    city: { findMany: async () => CITIES },
  };
  const service = new RestaurantService(prisma as any, { log: async () => undefined } as any);
  (service as any).findOne = async () => ({ id: 'r1', city: currentCity });
  return { service, updates };
}

describe('RestaurantService.update: the city must be one of the listed cities', () => {
  it('saves a listed city with the spelling of the Cities table', async () => {
    const { service, updates } = build('Edogawa');
    await service.update('t1', 'r1', { city: ' 東京 ' } as any, true);
    assert.equal(updates[0].data.city, 'Tokyo');
  });

  it('refuses text that is not a listed city, and saves nothing', async () => {
    const { service, updates } = build('Tokyo');
    await assert.rejects(service.update('t1', 'r1', { city: 'Tokyo, Japan' } as any, true), BadRequestException);
    assert.equal(updates.length, 0);
  });

  it('keeps an old unlisted city as it is when the settings page saves it unchanged', async () => {
    const { service, updates } = build('Edogawa');
    await service.update('t1', 'r1', { city: 'Edogawa', description: 'New text' } as any, true);
    assert.equal(updates[0].data.city, 'Edogawa');
  });

  it('lets the owner clear the city, and leaves it alone when it is not sent', async () => {
    const { service, updates } = build('Tokyo');
    await service.update('t1', 'r1', { city: '' } as any, true);
    assert.equal(updates[0].data.city, null);
    await service.update('t1', 'r1', { description: 'Hi' } as any, true);
    assert.equal('city' in updates[1].data, false);
  });
});
