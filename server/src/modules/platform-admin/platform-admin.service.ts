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

  async getOwnersOverview() {
    const [tenants, stats] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { restaurants: { some: {} } },
        include: {
          users: { where: { isSuperAdmin: true }, select: { name: true, email: true, phone: true }, take: 1 },
          restaurants: { select: { id: true, name: true } },
        },
      }),
      this.prisma.order.groupBy({
        by: ['restaurantId', 'status'],
        _count: true,
        _sum: { total: true, platformCommissionAmount: true },
      }),
    ]);

    const byRestaurant = new Map<string, { orders: number; sales: number; commission: number }>();
    for (const row of stats) {
      const entry = byRestaurant.get(row.restaurantId) ?? { orders: 0, sales: 0, commission: 0 };
      if (row.status !== 'CANCELLED') entry.orders += row._count;
      if (row.status === 'DELIVERED' || row.status === 'COMPLETED') {
        entry.sales += row._sum.total ?? 0;
        entry.commission += row._sum.platformCommissionAmount ?? 0;
      }
      byRestaurant.set(row.restaurantId, entry);
    }

    const owners = tenants.map((tenant) => {
      const restaurants = tenant.restaurants.map((r) => ({
        ...r,
        ...(byRestaurant.get(r.id) ?? { orders: 0, sales: 0, commission: 0 }),
      }));
      const sum = (key: 'orders' | 'sales' | 'commission') => restaurants.reduce((t, r) => t + r[key], 0);
      return {
        tenantId: tenant.id,
        owner: tenant.users[0] ?? null,
        restaurants,
        orders: sum('orders'),
        sales: sum('sales'),
        commission: sum('commission'),
      };
    });

    return { success: true, data: owners };
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

  // --- DELIVERIES & RIDERS SERVICE METHODS ---

  listDeliveryPartners() {
    return this.prisma.deliveryPartner.findMany({
      where: { deletedAt: null },
      include: { restaurant: { select: { id: true, name: true } } },
      orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async listAllDeliveries(status?: string) {
    const where = status ? { status: status as any } : {};
    const deliveries = await this.prisma.delivery.findMany({ 
      where, 
      include: { 
        order: {
          select: {
            orderNumber: true,
            total: true,
            deliveryAddress: true,
            restaurant: { select: { name: true } },
            customer: { select: { name: true, phone: true } },
          }
        }, 
        deliveryPerson: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
          }
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: deliveries };
  }

async listAllRiders(approvalStatus?: string) {
    const where: any = {};
    
    if (approvalStatus) {
      where.approvalStatus = approvalStatus;
    }

    const riders = await this.prisma.deliveryPerson.findMany({
      where,
      include: {
        _count: { select: { deliveries: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: riders };
  }

  async toggleRiderLock(id: string, isActive: boolean) {
    const rider = await this.prisma.deliveryPerson.findUnique({ where: { id } });
    if (!rider) throw new NotFoundException('Delivery rider not found');

    const updatedRider = await this.prisma.deliveryPerson.update({
      where: { id },
      data: { isActive },
    });

    await this.activityLog.log({
      actorType: 'PLATFORM_ADMIN',
      action: isActive ? 'RIDER_UNLOCKED' : 'RIDER_LOCKED',
      description: `Rider ${rider.name} (${rider.phone}) account was ${isActive ? 'unlocked' : 'locked'}`,
      metadata: { riderId: id }
    });

    return { success: true, message: `Rider account ${isActive ? 'unlocked' : 'locked'} successfully`, data: updatedRider };
  }

  async reviewRiderApproval(id: string, status: 'APPROVED' | 'REJECTED') {
    const rider = await this.prisma.deliveryPerson.findUnique({ where: { id } });
    if (!rider) throw new NotFoundException('Delivery rider not found');

    const updatedRider = await this.prisma.deliveryPerson.update({
      where: { id },
      data: { 
        approvalStatus: status,
        isActive: status === 'APPROVED', // Enable account if approved, keep locked if rejected
      },
    });

    await this.activityLog.log({
      actorType: 'PLATFORM_ADMIN',
      action: status === 'APPROVED' ? 'RIDER_APPROVED' : 'RIDER_REJECTED',
      description: `Rider ${rider.name} registration application was ${status.toLowerCase()}`,
      metadata: { riderId: id }
    });

    return { success: true, message: `Rider status updated to ${status}`, data: updatedRider };
  }

  // --- REFUNDS ---

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