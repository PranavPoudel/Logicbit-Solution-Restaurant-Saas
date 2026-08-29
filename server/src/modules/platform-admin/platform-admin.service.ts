import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import * as bcrypt from 'bcrypt';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { GenerateSettlementDto } from './dto/generate-settlement.dto';
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

  /**
   * getRevenueSummary()
   * ---------------------
   * तपाईं (platform owner) को लागि सबैभन्दा महत्वपूर्ण number — कुल कति
   * commission कमाइयो, कति tenant/restaurant active छन्, कति order भए।
   * यो PlatformAdminGuard ले protect गरेको छ — कुनै पनि restaurant owner
   * (जो आफ्नो tenant भित्र isSuperAdmin भए पनि) यो हेर्न पाउँदैनन्।
   */
  async getRevenueSummary(startDate?: string, endDate?: string) {
    const dateFilter =
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {};

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
        totalPlatformRevenue: commissionRevenue + advertisingRevenue, // तपाईंको (platform owner) कुल आम्दानी — दुबै स्रोत जोडेर
        activeAdvertisements: adRevenue._count.id,
        totalTenants: tenantCount,
        totalRestaurants: restaurantCount,
        activeRestaurants: activeRestaurantCount,
      },
    };
  }

  /**
   * listAllRestaurants()
   * ----------------------
   * GAP FIX: पहिले Platform Admin ले केवल aggregate number मात्र हेर्न
   * पाउँथे — कुनै specific restaurant लाई access गर्ने/नियन्त्रण गर्ने
   * बाटो नै थिएन। यसले सबै tenant भरिका restaurant list दिन्छ।
   */
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

  /** Problematic/fraudulent restaurant लाई platform बाट पूर्ण रूपमा suspend गर्ने (owner ले आफैं यो गर्न सक्दैनन्) */
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



  /** सम्झौता अनुसार commission दर बदल्ने (owner ले आफैं आफ्नो commission बदल्न पाउँदैनन् — केवल platform ले) */
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

  /** अनुचित/inappropriate banner वा popup content moderate गर्ने (customer complaint आएमा) */
  async removeStorefrontBanner(bannerId: string) {
    await this.prisma.storefrontBanner.delete({ where: { id: bannerId } });
    return { success: true, message: 'Banner removed by platform moderation' };
  }

  /** GAP FIX: Platform Admin (Super Admin) ले पनि सबै delivery को status हेर्न पाउने — oversight/support को लागि */
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

  /**
   * overrideRestaurantSetting()
   * -----------------------------
   * GAP FIX: "Super Admin ले चाह्यो भने सबै control गर्न सक्नुपर्छ" — यसअघि
   * Restaurant Owner ले आफ्नो restaurant मात्र (आफ्नो JWT tenantId भित्र)
   * edit गर्न सक्थे, Platform Admin ले कुनै restaurant को setting सिधै
   * बदल्न पाउँदैनथे (किनभने ती endpoint tenant-scoped थिए)। अब Platform
   * Admin ले जुनसुकै restaurant को कुनै पनि field (support/emergency को
   * लागि) सिधै बदल्न सक्छन् — full override authority।
   */
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

  /** Restaurant को पूरा detail (menu, category, storefront, ad, settlement सबै) एकैचोटि support/review को लागि */
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

  /** GAP FIX: Refund "PENDING" बाट "PROCESSED" मा मार्क गर्ने endpoint नै थिएन */
  async listPendingRefunds() {
    return this.prisma.refund.findMany({
      where: { status: 'PENDING' },
      include: { order: { select: { orderNumber: true, restaurantId: true } } },
    });
  }

  async processRefund(refundId: string) {
    const refund = await this.prisma.refund.update({
      where: { id: refundId },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });

    await this.activityLog.log({
      actorType: 'PLATFORM_ADMIN',
      action: 'REFUND_PROCESSED',
      description: `Refund of ${refund.amount} processed for order ${refund.orderId}`,
      metadata: { refundId, orderId: refund.orderId, amount: refund.amount },
    });

    return { success: true, data: refund };
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


  async listPendingSettlements() {
  const settlements = await this.prisma.settlement.findMany({
    where: { status: 'PENDING' },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      restaurant: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return { success: true, data: settlements };
}


async generateSettlement(restaurantId: string, dto: GenerateSettlementDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return { success: false, message: 'Restaurant not found' };

    const orders = await this.prisma.order.aggregate({
      where: {
        restaurantId,
        paymentMethod: 'COD',
        status: 'COMPLETED',
        createdAt: { gte: new Date(dto.periodStart), lte: new Date(dto.periodEnd) },
      },
      _sum: { total: true, platformCommissionAmount: true },
      _count: { id: true },
    });

    const settlement = await this.prisma.settlement.create({
      data: {
        tenantId: restaurant.tenantId,
        restaurantId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        totalOrders: orders._count.id || 0,
        totalCodAmount: orders._sum.total || 0,
        commissionDue: orders._sum.platformCommissionAmount || 0,
        status: 'PENDING',
      },
    });

    return { success: true, message: 'Settlement generated', data: settlement };
  }

  async markSettlementPaid(id: string) {
    const settlement = await this.prisma.settlement.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
    return { success: true, message: 'Settlement marked as paid', data: settlement };
  }

  async listAllSubscriptions() {
    const subscriptions = await this.prisma.restaurantSubscription.findMany({
      include: { plan: true, restaurant: { select: { name: true } } },
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
      include: { plan: true, restaurant: { select: { name: true } } },
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


