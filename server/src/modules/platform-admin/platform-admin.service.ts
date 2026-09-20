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
    const whereClause: any = { status: 'DELIVERED' };
    if (startDate && endDate) {
      whereClause.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const orders = await this.prisma.order.findMany({ where: whereClause });
    const totalOrderValue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalPlatformCommission = orders.reduce((sum, order) => sum + order.platformCommissionAmount, 0);

    return { success: true, data: { totalOrders: orders.length, totalOrderValue, totalPlatformCommission } };
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