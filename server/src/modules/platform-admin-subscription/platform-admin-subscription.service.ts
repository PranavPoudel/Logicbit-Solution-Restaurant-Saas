import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { addMonths } from 'date-fns';

@Injectable()
export class AdminSubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
  }

  async assignManualSubscription(restaurantId: string, planId: string, mode: 'MANUAL' | 'AUTO') {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) throw new NotFoundException('Subscription plan not found');

    const startDate = new Date();
    // 0 months means lifetime/free plan (never expires)
    const expiryDate = plan.durationMonths > 0 
      ? addMonths(startDate, plan.durationMonths) 
      : null;

    // Update the restaurant's billing mode
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { subscriptionMode: mode }
    });

    // Upsert the subscription record
    const subscription = await this.prisma.restaurantSubscription.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        planId,
        startDate,
        expiryDate,
        status: 'ACTIVE',
        autoRenew: mode === 'AUTO'
      },
      update: {
        planId,
        startDate,
        expiryDate,
        status: 'ACTIVE',
        autoRenew: mode === 'AUTO'
      }
    });

    return { success: true, data: subscription };
  }
}