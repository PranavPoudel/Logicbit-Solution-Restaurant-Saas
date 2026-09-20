import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateStaffDto } from './ dto/create-staff.dto';
import * as bcrypt from 'bcrypt';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { ApproveAdDto } from './dto/approve-ad.dto';
import { RejectAdDto } from './dto/reject-ad.dto';
import { CreateCuisineDto } from './dto/create-cuisine.dto';
import { UpdateCuisineDto } from './dto/update-cuisine.dto';

@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async getRevenueSummary(startDate?: string, endDate?: string) {
    const dateFilter = startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      },
    } : {};

    const [orderStats, tenantCount, restaurantCount, activeRestaurantCount, adRevenue] = await Promise.all([
      this.prisma.order.aggregate({
        where: { ...dateFilter, status: { not: 'CANCELLED' } },
        _sum: { total: true, platformCommissionAmount: true },
        _count: { id: true },
      }),
      this.prisma.tenant.count(),
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.advertisement.aggregate({
        where: { status: 'ACTIVE', ...dateFilter },
        _sum: { amountPaid: true },
        _count: { id: true },
      }),
    ]);

    const commissionRevenue = orderStats._sum.platformCommissionAmount ?? 0;
    const advertisingRevenue = adRevenue._sum.amountPaid ?? 0;

    return {
      success: true,
      data: {
        totalOrders: orderStats._count.id,
        totalGMV: orderStats._sum.total ?? 0,
        commissionRevenue,
        advertisingRevenue,
        totalPlatformRevenue: commissionRevenue + advertisingRevenue,
        activeAdvertisements: adRevenue._count.id,
        totalTenants: tenantCount,
        totalRestaurants: restaurantCount,
        activeRestaurants: activeRestaurantCount,
      },
    };
  }

  async listAllRestaurants(page = 1, limit = 20) {
    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { id: true, name: true } } },
      }),
      this.prisma.restaurant.count(),
    ]);
    return { success: true, data: { restaurants, pagination: { page, limit, total } } };
  }

  async suspendRestaurant(restaurantId: string, suspend: boolean) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isActive: !suspend },
    });

    await this.activityLog.log({
      tenantId: restaurant.tenantId,
      restaurantId,
      actorType: 'PLATFORM_ADMIN',
      action: suspend ? 'RESTAURANT_SUSPENDED' : 'RESTAURANT_REACTIVATED',
      description: `Restaurant ${suspend ? 'suspended' : 'reactivated'} by Platform Admin`,
    });

    return { success: true, message: suspend ? 'Restaurant suspended' : 'Restaurant reactivated', data: restaurant };
  }

  async listAllStaff() {
    const staff = await this.prisma.platformStaff.findMany({
      include: { role: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: staff };
  }

  async createStaff(dto: CreateStaffDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const staff = await this.prisma.platformStaff.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        roleId: dto.roleId,
      },
      include: { role: true },
    });
    return { success: true, message: 'Platform staff created', data: staff };
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      delete data.password;
    }

    const staff = await this.prisma.platformStaff.update({
      where: { id },
      data,
      include: { role: true },
    });
    return { success: true, message: 'Platform staff updated', data: staff };
  }

  async updateCommissionRate(restaurantId: string, percent: number) {
    const existing = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    const restaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { platformCommissionPercent: percent },
    });

    await this.activityLog.log({
      tenantId: restaurant.tenantId,
      restaurantId,
      actorType: 'PLATFORM_ADMIN',
      action: 'COMMISSION_CHANGED',
      description: `Commission rate changed from ${existing?.platformCommissionPercent}% to ${percent}%`,
      metadata: { oldPercent: existing?.platformCommissionPercent, newPercent: percent },
    });

    return { success: true, data: restaurant };
  }

  async removeStorefrontBanner(bannerId: string) {
    await this.prisma.storefrontBanner.delete({ where: { id: bannerId } });
    return { success: true, message: 'Banner removed by platform moderation' };
  }

  async listAllDeliveries(status?: string) {
    return this.prisma.delivery.findMany({
      where: status ? { status: status as any } : {},
      include: {
        order: { select: { orderNumber: true, restaurantId: true, deliveryAddress: true } },
        deliveryPerson: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async overrideRestaurantSetting(restaurantId: string, data: Record<string, any>) {
    const restaurant = await this.prisma.restaurant.update({ where: { id: restaurantId }, data });

    await this.activityLog.log({
      tenantId: restaurant.tenantId,
      restaurantId,
      actorType: 'PLATFORM_ADMIN',
      action: 'RESTAURANT_SETTING_OVERRIDDEN',
      description: `Platform Admin directly modified restaurant settings: ${Object.keys(data).join(', ')}`,
      metadata: data,
    });

    return { success: true, data: restaurant };
  }

  async getRestaurantFullDetail(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        tenant: { select: { id: true, name: true } },
        categories: true,
        menuItems: { where: { deletedAt: null } },
      },
    });
    if (!restaurant) return { success: false, message: 'Restaurant not found' };

    const [orders, settlements, ads] = await Promise.all([
      this.prisma.order.count({ where: { restaurantId } }),
      this.prisma.settlement.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.advertisement.findMany({ where: { restaurantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return { success: true, data: { ...restaurant, totalOrders: orders, recentSettlements: settlements, recentAds: ads } };
  }

  async getTopRestaurantsByRevenue(limit = 10) {
    const restaurants = await this.prisma.order.groupBy({
      by: ['restaurantId'],
      where: { status: { not: 'CANCELLED' } },
      _sum: { platformCommissionAmount: true, total: true },
      _count: { id: true },
      orderBy: { _sum: { platformCommissionAmount: 'desc' } },
      take: limit,
    });

    const restaurantIds = restaurants.map((r) => r.restaurantId);
    const restaurantDetails = await this.prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
      select: { id: true, name: true, city: true },
    });
    const detailMap = new Map(restaurantDetails.map((r) => [r.id, r]));

    return {
      success: true,
      data: restaurants.map((r) => ({
        restaurant: detailMap.get(r.restaurantId),
        totalOrders: r._count.id,
        totalGMV: r._sum.total,
        commissionEarned: r._sum.platformCommissionAmount,
      })),
    };
  }

  async listAllRoles() {
    const roles = await this.prisma.platformRole.findMany({
      include: { permissions: { include: { permission: true } } },
    });
    return { success: true, data: roles };
  }

  async createRole(dto: CreateRoleDto) {
    const role = await this.prisma.platformRole.create({
      data: {
        name: dto.name,
        permissions: {
          create: dto.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
    return { success: true, data: role };
  }

  async listAllPermissions() {
    const permissions = await this.prisma.platformPermission.findMany();
    return { success: true, data: permissions };
  }

  async listAllSubscriptions() {
    const subscriptions = await this.prisma.restaurantSubscription.findMany({
      include: { plan: true },
    });
    return { success: true, data: subscriptions };
  }

  async getExpiringSubscriptions() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const subscriptions = await this.prisma.restaurantSubscription.findMany({
      where: {
        expiryDate: { lte: thirtyDaysFromNow, gte: new Date() },
        status: 'ACTIVE',
      },
      include: { plan: true },
    });
    return { success: true, data: subscriptions };
  }

  async createPlan(dto: CreatePlanDto) {
    const plan = await this.prisma.subscriptionPlan.create({ data: dto });
    return { success: true, data: plan };
  }

  async listAllPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany();
    return { success: true, data: plans };
  }

  async renewSubscription(restaurantId: string) {
    const sub = await this.prisma.restaurantSubscription.findUnique({
      where: { restaurantId },
      include: { plan: true },
    });

    if (!sub) return { success: false, message: 'Subscription not found' };

    const currentExpiry = sub.expiryDate && sub.expiryDate > new Date() ? sub.expiryDate : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + sub.plan.durationMonths);

    const updated = await this.prisma.restaurantSubscription.update({
      where: { restaurantId },
      data: { expiryDate: newExpiry, status: 'ACTIVE' },
    });

    return { success: true, message: 'Subscription renewed', data: updated };
  }

  async listPendingAds() {
    const ads = await this.prisma.advertisement.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const restaurantIds = [...new Set(ads.map((ad) => ad.restaurantId))];
    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
      select: { id: true, name: true },
    });

    const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));

    const data = ads.map((ad) => ({
      ...ad,
      restaurant: restaurantMap.get(ad.restaurantId) ?? null,
    }));

    return { success: true, data };
  }

  async approveAd(id: string, dto: ApproveAdDto) {
    const ad = await this.prisma.advertisement.update({
      where: { id },
      data: { status: 'ACTIVE', priority: dto.priority ?? 0 },
    });
    return { success: true, message: 'Advertisement approved', data: ad };
  }

  async rejectAd(id: string, dto: RejectAdDto) {
    const ad = await this.prisma.advertisement.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: dto.rejectionReason },
    });
    return { success: true, message: 'Advertisement rejected', data: ad };
  }

  async getCuisines() {
    return this.prisma.cuisine.findMany();
  }

  async createCuisine(dto: CreateCuisineDto) {
    const cuisine = await this.prisma.cuisine.create({ data: dto });
    return { success: true, data: cuisine };
  }

  async updateCuisine(id: string, dto: UpdateCuisineDto) {
    const cuisine = await this.prisma.cuisine.update({ where: { id }, data: dto });
    return { success: true, data: cuisine };
  }

  async deleteCuisine(id: string) {
    await this.prisma.cuisine.delete({ where: { id } });
    return { success: true, message: 'Cuisine deleted successfully' };
  }
}