// src/modules/platform-admin/platform-admin.controller.ts
import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsNumber, Min, Max, IsBoolean, IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';

import { PlatformAdminService } from './platform-admin.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

export class UpdateCommissionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percent: number;
}

export class SuspendRestaurantDto {
  @IsBoolean()
  suspend: boolean;
}

export class ToggleRiderLockDto {
  @IsBoolean()
  isActive: boolean;
}

export class ReviewRiderApprovalDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
}

@ApiTags('Platform Admin - Core Dashboard')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin')
export class PlatformAdminController {
  constructor(
    private readonly platformAdminService: PlatformAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get('revenue-summary')
  @RequirePlatformPermission('VIEW_REVENUE')
  getRevenueSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.platformAdminService.getRevenueSummary(startDate, endDate);
  }

  @Get('top-restaurants')
  @RequirePlatformPermission('VIEW_REVENUE')
  getTopRestaurants(@Query('limit') limit?: string) {
    return this.platformAdminService.getTopRestaurantsByRevenue(limit ? Number(limit) : undefined);
  }

  @Get('owners-overview')
  @RequirePlatformPermission('VIEW_REVENUE')
  getOwnersOverview() {
    return this.platformAdminService.getOwnersOverview();
  }

  @Get('restaurants')
  @RequirePlatformPermission('VIEW_RESTAURANTS')
  listAllRestaurants(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.platformAdminService.listAllRestaurants(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }

  @Get('restaurants/:id')
  @RequirePlatformPermission('VIEW_RESTAURANTS')
  getRestaurantFullDetail(@Param('id') id: string) {
    return this.platformAdminService.getRestaurantFullDetail(id);
  }

  @Patch('restaurants/:id/override')
  @RequirePlatformPermission('OVERRIDE_RESTAURANT_SETTINGS')
  overrideRestaurantSetting(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.platformAdminService.overrideRestaurantSetting(id, data);
  }

  @Patch('restaurants/:id/suspend')
  @RequirePlatformPermission('SUSPEND_RESTAURANT')
  suspendRestaurant(@Param('id') id: string, @Body() dto: SuspendRestaurantDto) {
    return this.platformAdminService.suspendRestaurant(id, dto.suspend);
  }

  @Patch('restaurants/:id/commission')
  @RequirePlatformPermission('MANAGE_COMMISSION')
  updateCommission(@Param('id') id: string, @Body() dto: UpdateCommissionDto) {
    return this.platformAdminService.updateCommissionRate(id, dto.percent);
  }

  @Delete('storefront-banners/:id')
  @RequirePlatformPermission('MODERATE_CONTENT')
  removeBanner(@Param('id') id: string) {
    return this.platformAdminService.removeStorefrontBanner(id);
  }

  // --- DELIVERIES & RIDERS MANAGEMENT ---

  @Get('deliveries')
  @RequirePlatformPermission('VIEW_DELIVERIES')
  listAllDeliveries(@Query('status') status?: string) {
    return this.platformAdminService.listAllDeliveries(status);
  }

  @Get('delivery-partners')
  @RequirePlatformPermission('VIEW_DELIVERIES')
  listDeliveryPartners() {
    return this.platformAdminService.listDeliveryPartners();
  }

  @Get('riders')
  @RequirePlatformPermission('VIEW_DELIVERIES')
  listAllRiders(@Query('approvalStatus') approvalStatus?: string) {
    return this.platformAdminService.listAllRiders(approvalStatus);
  }

  @Patch('riders/:id/lock')
  @RequirePlatformPermission('MANAGE_DELIVERIES')
  toggleRiderLock(@Param('id') id: string, @Body() dto: ToggleRiderLockDto) {
    return this.platformAdminService.toggleRiderLock(id, dto.isActive);
  }

  @Patch('riders/:id/approval')
  @RequirePlatformPermission('MANAGE_DELIVERIES')
  reviewRiderApproval(@Param('id') id: string, @Body() dto: ReviewRiderApprovalDto) {
    return this.platformAdminService.reviewRiderApproval(id, dto.status);
  }

  // --- ACTIVITY LOGS & REFUNDS ---

  @Get('restaurants/:id/activity-logs')
  @RequirePlatformPermission('VIEW_ACTIVITY_LOGS')
  getRestaurantActivityLogs(
    @Param('id') id: string,
    @Query('action') action?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityLogService.findForRestaurant(id, action, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }

  @Get('activity-logs')
  @RequirePlatformPermission('VIEW_ACTIVITY_LOGS')
  getAllActivityLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.activityLogService.findAll(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }

  @Get('refunds/pending')
  @RequirePlatformPermission('PROCESS_REFUNDS')
  listPendingRefunds() {
    return this.platformAdminService.listPendingRefunds();
  }

  @Patch('refunds/:id/process')
  @RequirePlatformPermission('PROCESS_REFUNDS')
  processRefund(@Param('id') id: string) {
    return this.platformAdminService.processRefund(id);
  }
}