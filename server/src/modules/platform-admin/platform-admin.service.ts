import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async getRevenueSummary(startDate?: string, endDate?: string) {
    // 1. Get active subscriptions to calculate MRR and count
    const activeSubs = await this.prisma.restaurantSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });

    const activeSubscriptions = activeSubs.length;
    const mrr = activeSubs.reduce((sum, sub) => sum + (Number(sub.plan?.price) || 0), 0);

    // 2. Fetch recent subscriptions (REMOVED the invalid 'restaurant' include)
    const recentSubs = await this.prisma.restaurantSubscription.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { 
        plan: { select: { name: true, price: true } } 
      },
    });

    // 3. Manually fetch the restaurant names to avoid Prisma schema errors
    const restaurantIds = recentSubs.map(sub => sub.restaurantId);
    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
      select: { id: true, name: true }
    });

    // 4. Calculate total platform commission from orders
    const whereClause: any = { status: 'DELIVERED' };
    if (startDate && endDate) {
      whereClause.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    const orders = await this.prisma.order.findMany({ where: whereClause });
    const totalPlatformCommission = orders.reduce((sum, order) => sum + order.platformCommissionAmount, 0);

    const recentTransactions = recentSubs.map(sub => {
      const restaurant = restaurants.find(r => r.id === sub.restaurantId);
      return {
        id: sub.id,
        restaurantName: restaurant?.name || 'Unknown Restaurant',
        planName: sub.plan?.name || 'Custom Plan',
        amount: sub.plan?.price || 0,
        date: sub.createdAt,
        status: sub.status,
      };
    });

    const totalRevenue = totalPlatformCommission + mrr; 

    return { 
      success: true, 
      data: { 
        totalRevenue,
        mrr,
        activeSubscriptions,
        recentTransactions 
      } 
    };
  }

  async getTopRestaurantsByRevenue(limit: number = 10) {
    const result = await this.prisma.order.groupBy({
      by: ['restaurantId'],
      _sum: { total: true, platformCommissionAmount: true },
      orderBy: { _sum: { total: 'desc' } },
      take: limit,
      where: { status: 'DELIVERED' }
    });

    return { success: true, data: result };
  }

  async listAllRestaurants(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({ skip, take: limit, include: { tenant: true } }),
      this.prisma.restaurant.count(),
    ]);

    return { success: true, data: restaurants, meta: { total, page, limit } };
  }

  async getRestaurantFullDetail(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { tenant: true }, 
    });
    
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const subscription = await this.prisma.restaurantSubscription.findUnique({
      where: { restaurantId: id },
      include: { plan: true }
    });
    
    const storefrontConfig = await this.prisma.storefrontConfig.findUnique({
      where: { restaurantId: id }
    });

    return { 
      success: true, 
      data: { ...restaurant, subscription, storefrontConfig } 
    };
  }

  async overrideRestaurantSetting(id: string, data: Record<string, any>) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data, 
    });
    return { success: true, data: restaurant };
  }

  async suspendRestaurant(id: string, suspend: boolean) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { isActive: !suspend },
    });
    
    await this.activityLog.log({
      tenantId: restaurant.tenantId,
      actorType: 'PLATFORM_ADMIN',
      action: suspend ? 'RESTAURANT_SUSPENDED' : 'RESTAURANT_UNSUSPENDED',
      description: `Restaurant ${restaurant.name} was ${suspend ? 'suspended' : 'unsuspended'}`,
    });

    return { success: true, data: restaurant };
  }

  async updateCommissionRate(id: string, percent: number) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { platformCommissionPercent: percent },
    });
    return { success: true, data: restaurant };
  }

  async removeStorefrontBanner(id: string) {
    await this.prisma.storefrontBanner.delete({ where: { id } });
    return { success: true, message: 'Banner removed by platform admin' };
  }

  async listAllDeliveries(status?: string) {
    const where = status ? { status: status as any } : {};
    return this.prisma.delivery.findMany({ where, include: { order: true, deliveryPerson: true } });
  }

  async listPendingRefunds() {
    const refunds = await this.prisma.refund.findMany({
      where: { status: 'PENDING' },
      include: { order: { select: { orderNumber: true, total: true, tenantId: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: refunds };
  }

  async processRefund(id: string) {
    const refund = await this.prisma.refund.update({
      where: { id },
      data: { status: 'PROCESSED', processedAt: new Date() },
      include: { order: true },
    });
    
    await this.activityLog.log({
      tenantId: refund.order.tenantId,
      actorType: 'PLATFORM_ADMIN',
      action: 'REFUND_PROCESSED',
      description: `Refund processed for order ${refund.order.orderNumber}`,
      metadata: { refundId: refund.id, amount: refund.amount },
    });

    return { success: true, message: 'Refund processed successfully', data: refund };
  }
}