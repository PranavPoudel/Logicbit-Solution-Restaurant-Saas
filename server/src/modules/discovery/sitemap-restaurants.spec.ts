import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService.findSitemapRestaurants', () => {
  it('lists only live restaurants, and only their slug and last change', async () => {
    const calls: any[] = [];
    const rows = [{ slug: 'momo-house', updatedAt: new Date('2026-11-01') }];
    const prisma = { restaurant: { findMany: async (args: any) => (calls.push(args), rows) } };
    const result = await new DiscoveryService(prisma as any, null as any, null as any).findSitemapRestaurants();

    assert.deepEqual(result, { success: true, data: rows });
    assert.equal(calls[0].where.isActive, true);
    assert.deepEqual(calls[0].select, { slug: true, updatedAt: true });
  });
});
