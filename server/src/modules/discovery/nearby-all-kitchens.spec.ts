import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DiscoveryService } from './discovery.service';
import { MAX_RADIUS_KM, NearbyQueryDto } from './dto/nearby-query.dto';

// The website lists every kitchen, not only those within 50 km. Near ones must still rank first.

const check = (radiusKm: number) => validateSync(plainToInstance(NearbyQueryDto, { lat: '35.7', lng: '139.7', radiusKm: String(radiusKm) }));

describe('nearby search radius', () => {
  it('accepts a radius wide enough to reach every restaurant, and nothing beyond it', () => {
    assert.equal(check(MAX_RADIUS_KM).length, 0);
    assert.equal(check(MAX_RADIUS_KM + 1).length, 1);
  });
});

describe('nearby search ranking', () => {
  const row = (id: string, distanceKm: number, avgRating: number) => ({ id, name: id, distanceKm, avgRating, isOpen: true, isActive: true });

  async function search(radiusKm: number) {
    // the far one is better rated, so only a distance weight that has not been diluted by the wide search keeps the near one first
    const rows = [row('far', 5000, 5), row('near', 1, 3)];
    const prisma = {
      $queryRaw: async () => rows,
      order: { groupBy: async () => [] },
      restaurantCuisine: { findMany: async () => [] },
    };
    const ads = { getSearchBoostedRestaurantIds: async () => new Set<string>() };
    const service = new DiscoveryService(prisma as any, null as any, ads as any);
    const result = await service.findNearby({ lat: 35.7, lng: 139.7, radiusKm, sortBy: 'recommended', page: 1, limit: 20 } as any);
    return result.data.restaurants.map((r: any) => r.id);
  }

  it('lists a far kitchen after a near one even when the search covers the whole world', async () => {
    assert.deepEqual(await search(MAX_RADIUS_KM), ['near', 'far']);
  });

});
