import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminSubscriptionService } from './platform-admin-subscription.service';

@Controller('api/v1/platform-admin/subscriptions')
export class AdminSubscriptionController {
  constructor(private readonly adminSubscriptionService: AdminSubscriptionService) {}

  @Get('plans')
  async getPlans() {
    const plans = await this.adminSubscriptionService.getAllPlans();
    return { success: true, data: plans };
  }

  @Post('manual-assign')
  async assignSubscription(
    @Body() body: { restaurantId: string; planId: string; mode: 'MANUAL' | 'AUTO' }
  ) {
    return this.adminSubscriptionService.assignManualSubscription(
      body.restaurantId, 
      body.planId, 
      body.mode
    );
  }
}