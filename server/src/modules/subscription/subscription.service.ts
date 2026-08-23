import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { CreatePlanDto, RenewSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // ---------- Platform Admin: Plan Management ----------

  async createPlan(dto: CreatePlanDto) {
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async findAllPlans() {
    return this.prisma.subscriptionPlan.findMany({ where: { isActive: true } });
  }

  // ---------- Platform Admin: Assign/Renew (Domain-renewal जस्तो) ----------

  /**
   * renewSubscription()
   * ----------------------
   * Platform Admin ले directly renew गर्ने — domain renewal system जस्तै।
   * Plan को durationMonths बाट नयाँ expiryDate calculate हुन्छ (आजको मिति
   * वा हालको expiry, जुन पछि हो त्यहाँबाट थप्ने — ताकि समयमै renew गरे
   * बाँकी दिन खेर नजाओस्)।
   */
  async renewSubscription(restaurantId: string, dto: RenewSubscriptionDto, renewedBy: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const existing = await this.prisma.restaurantSubscription.findUnique({ where: { restaurantId } });

    let expiryDate: Date | null = null;
    if (dto.customExpiryDate) {
      expiryDate = new Date(dto.customExpiryDate);
    } else if (plan.durationMonths > 0) {
      const baseDate = existing?.expiryDate && existing.expiryDate > new Date() ? existing.expiryDate : new Date();
      expiryDate = new Date(baseDate);
      expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);
    }
    // durationMonths === 0 (Free plan) भए expiryDate null नै रहन्छ — कहिल्यै expire हुँदैन

    const subscription = await this.prisma.restaurantSubscription.upsert({
      where: { restaurantId },
      create: { restaurantId, planId: plan.id, expiryDate, status: 'ACTIVE' },
      update: { planId: plan.id, expiryDate, status: 'ACTIVE', lastReminderSentDaysBefore: null },
    });

    // Renew भएपछि restaurant फेरि active हुनुपर्छ (expire भएर suspend भएको भए)
    await this.prisma.restaurant.update({ where: { id: restaurantId }, data: { isActive: true } });

    await this.activityLog.log({
      tenantId: restaurant.tenantId,
      restaurantId,
      actorType: 'PLATFORM_ADMIN',
      actorId: renewedBy,
      action: 'SUBSCRIPTION_RENEWED',
      description: `Subscription renewed with plan "${plan.name}", new expiry: ${expiryDate?.toISOString() ?? 'Never (Free plan)'}`,
    });

    return { success: true, data: subscription };
  }

  // ---------- Platform Admin: Overview ----------

  async listAll() {
    return this.prisma.restaurantSubscription.findMany({
      include: { plan: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async listExpiringSoon(withinDays = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);

    return this.prisma.restaurantSubscription.findMany({
      where: { status: 'ACTIVE', expiryDate: { not: null, lte: cutoff, gte: new Date() } },
      include: { plan: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ---------- Restaurant Owner ----------

  async getMySubscription(tenantId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const subscription = await this.prisma.restaurantSubscription.findUnique({
      where: { restaurantId },
      include: { plan: true },
    });

    if (!subscription) {
      return { success: true, data: { status: 'NO_SUBSCRIPTION', message: 'No active membership. Please contact support.' } };
    }

    const daysRemaining = subscription.expiryDate
      ? Math.ceil((subscription.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return { success: true, data: { ...subscription, daysRemaining } };
  }

  async toggleAutoRenew(tenantId: string, restaurantId: string, autoRenew: boolean) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const subscription = await this.prisma.restaurantSubscription.update({
      where: { restaurantId },
      data: { autoRenew },
    });
    return { success: true, data: subscription };
  }
}
