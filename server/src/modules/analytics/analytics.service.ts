import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRestaurantAnalytics(tenantId: string, restaurantId: string) {
    // 1. Strict Tenant Scoping: Verify the restaurant belongs to this tenant
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, tenantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found or access denied');
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 2. Total Revenue & Total Orders (All-time completed orders)
    const orderStats = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    const totalRevenue = Number((orderStats._sum.total || 0).toFixed(2));
    const totalOrders = orderStats._count.id || 0;

    // 3. New Customers (Unique customers who placed an order in the last 30 days)
    const recentCustomers = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        restaurantId,
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
    });
    const newCustomers = recentCustomers.length;

    // 4. Revenue Trend (Last 7 days)
    const trendOrders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    const revenueTrendMap = new Map<string, number>();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last 7 days with 0 to ensure the chart always has 7 points
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = days[d.getDay()];
      revenueTrendMap.set(dayName, 0);
    }

    // Aggregate the fetched orders into the map
    for (const order of trendOrders) {
      const dayName = days[order.createdAt.getDay()];
      revenueTrendMap.set(dayName, (revenueTrendMap.get(dayName) || 0) + order.total);
    }

    const revenueTrend = Array.from(revenueTrendMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: Number(revenue.toFixed(2)),
    }));

    // 5. Top Selling Items (All-time)
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: {
          restaurantId,
          status: { in: ['DELIVERED', 'COMPLETED'] },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    // Fetch menu item names to join with the aggregated data
    const menuItemIds = topItems.map((item) => item.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true },
    });

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item.name]));

    const topSellingItems = topItems.map((item) => ({
      name: menuItemMap.get(item.menuItemId) || 'Unknown Item',
      sold: item._sum.quantity || 0,
      revenue: Number((item._sum.subtotal || 0).toFixed(2)),
    }));

    return {
      totalRevenue,
      totalOrders,
      newCustomers,
      revenueTrend,
      topSellingItems,
    };
  }
}