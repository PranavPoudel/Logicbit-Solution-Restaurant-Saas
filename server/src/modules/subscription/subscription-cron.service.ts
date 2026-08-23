import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

const REMINDER_THRESHOLDS_DAYS = [30, 15, 7, 3, 1];

/**
 * SubscriptionCronService
 * -------------------------
 * हरेक दिन एकपटक चल्ने job (domain-renewal system जस्तै):
 *  1. Expiry नजिकिएका subscription (30/15/7/3/1 दिन बाँकी) भेट्टाएर
 *     Restaurant Owner + सबै Platform Staff लाई notification पठाउने
 *  2. Auto-renew ON भएका subscription, expire भएकै दिन आफैं renew गर्ने
 *  3. Auto-renew OFF भई expire भइसकेका subscription लाई EXPIRED मार्क
 *     गरेर Restaurant लाई suspend (isActive: false) गर्ने
 */
@Injectable()
export class SubscriptionCronService {
  private readonly logger = new Logger(SubscriptionCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly activityLog: ActivityLogService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailySubscriptionCheck() {
    this.logger.log('Running daily subscription check...');
    await this.sendExpiryReminders();
    await this.processExpiredSubscriptions();
  }

  private async sendExpiryReminders() {
    const activeSubscriptions = await this.prisma.restaurantSubscription.findMany({
      where: { status: 'ACTIVE', expiryDate: { not: null } },
      include: { plan: true },
    });

    for (const sub of activeSubscriptions) {
      const daysRemaining = Math.ceil((sub.expiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // 30/15/7/3/1 मध्ये आजको दिन कुनैसँग exact match भयो, र पहिले नै
      // यही threshold को reminder नपठाइएको भए मात्र पठाउने (duplicate रोक्न)
      const matchedThreshold = REMINDER_THRESHOLDS_DAYS.find((t) => daysRemaining === t);
      if (!matchedThreshold || sub.lastReminderSentDaysBefore === matchedThreshold) continue;

      const restaurant = await this.prisma.restaurant.findUnique({ where: { id: sub.restaurantId } });
      if (!restaurant) continue;

      // Restaurant Owner हरूलाई notify
      const owners = await this.prisma.user.findMany({ where: { tenantId: restaurant.tenantId, isActive: true } });
      for (const owner of owners) {
        await this.notificationService.send({
          tenantId: restaurant.tenantId,
          channel: 'EMAIL',
          recipient: owner.email,
          subject: `Your LogicBit membership expires in ${matchedThreshold} day(s)`,
          body: `Restaurant "${restaurant.name}"'s subscription (${sub.plan.name}) will expire in ${matchedThreshold} day(s). Please renew to avoid service interruption.${sub.autoRenew ? ' Auto-renew is enabled.' : ''}`,
        });
      }

      // सबै Platform Staff लाई पनि notify
      const platformStaff = await this.prisma.platformStaff.findMany({ where: { isActive: true } });
      for (const staff of platformStaff) {
        await this.notificationService.send({
          channel: 'EMAIL',
          recipient: staff.email,
          subject: `Restaurant subscription expiring: ${restaurant.name}`,
          body: `"${restaurant.name}"'s subscription expires in ${matchedThreshold} day(s). Auto-renew: ${sub.autoRenew ? 'ON' : 'OFF'}.`,
        });
      }

      await this.prisma.restaurantSubscription.update({
        where: { id: sub.id },
        data: { lastReminderSentDaysBefore: matchedThreshold },
      });

      await this.activityLog.log({
        tenantId: restaurant.tenantId,
        restaurantId: restaurant.id,
        actorType: 'SYSTEM',
        action: 'SUBSCRIPTION_REMINDER_SENT',
        description: `Expiry reminder sent (${matchedThreshold} days remaining)`,
      });
    }
  }

  private async processExpiredSubscriptions() {
    const expiredSubs = await this.prisma.restaurantSubscription.findMany({
      where: { status: 'ACTIVE', expiryDate: { not: null, lte: new Date() } },
      include: { plan: true },
    });

    for (const sub of expiredSubs) {
      if (sub.autoRenew) {
        // Auto-renew ON — आफैं renew (expiry date थप्ने)
        const newExpiryDate = new Date(sub.expiryDate!);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + sub.plan.durationMonths);

        await this.prisma.restaurantSubscription.update({
          where: { id: sub.id },
          data: { expiryDate: newExpiryDate, lastReminderSentDaysBefore: null },
        });

        await this.activityLog.log({
          restaurantId: sub.restaurantId,
          actorType: 'SYSTEM',
          action: 'SUBSCRIPTION_AUTO_RENEWED',
          description: `Auto-renewed until ${newExpiryDate.toISOString()}`,
        });
      } else {
        // Auto-renew OFF — Expire गरेर restaurant suspend
        await this.prisma.$transaction([
          this.prisma.restaurantSubscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } }),
          this.prisma.restaurant.update({ where: { id: sub.restaurantId }, data: { isActive: false } }),
        ]);

        await this.activityLog.log({
          restaurantId: sub.restaurantId,
          actorType: 'SYSTEM',
          action: 'SUBSCRIPTION_EXPIRED',
          description: 'Subscription expired — restaurant suspended pending renewal',
        });
      }
    }
  }
}
