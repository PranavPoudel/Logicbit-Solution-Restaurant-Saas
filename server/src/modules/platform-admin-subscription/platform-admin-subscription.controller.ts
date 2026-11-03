import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';
import { AdminSubscriptionService } from './platform-admin-subscription.service';
import { ManualAssignDto } from './dto/manual-assign.dto';

@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin/subscriptions')
export class AdminSubscriptionController {
  constructor(private readonly adminSubscriptionService: AdminSubscriptionService) {}

  @Get('plans')
  async getPlans() {
    const plans = await this.adminSubscriptionService.getAllPlans();
    return { success: true, data: plans };
  }

  @Post('manual-assign')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  async assignSubscription(
    @Body() body: ManualAssignDto
  ) {
    return this.adminSubscriptionService.assignManualSubscription(
      body.restaurantId, 
      body.planId, 
      body.mode
    );
  }
}