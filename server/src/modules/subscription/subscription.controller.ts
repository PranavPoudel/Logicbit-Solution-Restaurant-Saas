import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';
import { SubscriptionService } from './subscription.service';
import { CreatePlanDto, RenewSubscriptionDto, ToggleAutoRenewDto } from './dto/subscription.dto';

@ApiTags('Subscription - Restaurant Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/subscription')
export class RestaurantSubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  getMySubscription(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.subscriptionService.getMySubscription(req.user.tenantId, restaurantId);
  }

  @Patch('auto-renew')
  toggleAutoRenew(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: ToggleAutoRenewDto) {
    return this.subscriptionService.toggleAutoRenew(req.user.tenantId, restaurantId, dto.autoRenew);
  }
}

@ApiTags('Subscription - Platform Admin')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin/subscriptions')
export class PlatformSubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('plans')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionService.createPlan(dto);
  }

  @Get('plans')
  findAllPlans() {
    return this.subscriptionService.findAllPlans();
  }

  @Get()
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  listAll() {
    return this.subscriptionService.listAll();
  }

  @Get('expiring-soon')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  listExpiringSoon(@Query('withinDays') withinDays?: string) {
    return this.subscriptionService.listExpiringSoon(withinDays ? Number(withinDays) : undefined);
  }

  /** Domain renewal जस्तै — Platform Admin ले directly renew गर्ने */
  @Post('restaurants/:restaurantId/renew')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  renew(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: RenewSubscriptionDto) {
    return this.subscriptionService.renewSubscription(restaurantId, dto, req.user.id);
  }
}
