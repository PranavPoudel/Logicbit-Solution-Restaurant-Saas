import { Controller, Get, Patch, Delete, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

// Guards & Decorators
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';

import { PlatformAdminService } from './platform-admin.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

import { CreateRoleDto } from '../roles/dto/create-role.dto';
import { CreateStaffDto } from '../platform-staff/dto/create-staff.dto';
import { UpdateStaffDto } from '../platform-staff/dto/update-staff.dto';
import { GenerateSettlementDto } from '../settlement/dto/settlement.dto';
import { CreatePlanDto } from '../subscription/dto/create-plan.dto';
import { ApproveAdDto } from '../advertisement/dto/approve-ad.dto';
import { RejectAdDto } from '../advertisement/dto/reject-ad.dto';
import { CreateCuisineDto } from '../cuisine/dto/create-cuisine.dto';
import { UpdateCuisineDto } from '../cuisine/dto/update-cuisine.dto';

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

@ApiTags('Platform Admin (Super Admin)')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin')
export class PlatformAdminController {
  constructor(
    private readonly platformAdminService: PlatformAdminService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  // ... (All your endpoints remain exactly the same, they will now use the correctly imported DTOs)

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

  @Get('deliveries')
  @RequirePlatformPermission('VIEW_DELIVERIES')
  listAllDeliveries(@Query('status') status?: string) {
    return this.platformAdminService.listAllDeliveries(status);
  }

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

  @Get('staff')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  listAllStaff(){
    return this.platformAdminService.listAllStaff();
  }
  
  @Post('staff')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.platformAdminService.createStaff(dto);
  }

  @Patch('staff/:id')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.platformAdminService.updateStaff(id, dto);
  }

  @Get('staff/roles')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  listAllRoles() {
    return this.platformAdminService.listAllRoles();
  }

  @Post('staff/roles')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  createRole(@Body() dto: CreateRoleDto) {
    return this.platformAdminService.createRole(dto);
  }

  @Get('staff/permissions')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  listAllPermissions() {
    return this.platformAdminService.listAllPermissions();
  }

  @Get('settlements/pending')
  @RequirePlatformPermission('MANAGE_SETTLEMENTS')
  listPendingSettlements() {
    return this.platformAdminService.listPendingSettlements();
  }

  @Post('settlements/restaurants/:id/generate')
  @RequirePlatformPermission('MANAGE_SETTLEMENTS')
  generateSettlement(@Param('id') id: string, @Body() dto: GenerateSettlementDto) {
    return this.platformAdminService.generateSettlement(id, dto);
  }

  @Patch('settlements/:id/mark-paid')
  @RequirePlatformPermission('MANAGE_SETTLEMENTS')
  markSettlementPaid(@Param('id') id: string) {
    return this.platformAdminService.markSettlementPaid(id);
  }
  
  @Get('subscriptions')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  listAllSubscriptions() {
    return this.platformAdminService.listAllSubscriptions();
  }

  @Get('subscriptions/expiring-soon')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  getExpiringSubscriptions() {
    return this.platformAdminService.getExpiringSubscriptions();
  }

  @Post('subscriptions/plans')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.platformAdminService.createPlan(dto);
  }

  @Get('subscriptions/plans')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  listAllPlans() {
    return this.platformAdminService.listAllPlans();
  }

  @Post('subscriptions/restaurants/:id/renew')
  @RequirePlatformPermission('MANAGE_SUBSCRIPTIONS')
  renewSubscription(@Param('id') id: string) {
    return this.platformAdminService.renewSubscription(id);
  }

  @Get('advertisements/pending')
  @RequirePlatformPermission('MANAGE_ADVERTISEMENTS')
  listPendingAds() {
    return this.platformAdminService.listPendingAds();
  }

  @Patch('advertisements/:id/approve')
  @RequirePlatformPermission('MANAGE_ADVERTISEMENTS')
  approveAd(@Param('id') id: string, @Body() dto: ApproveAdDto) {
    return this.platformAdminService.approveAd(id, dto);
  }

  @Patch('advertisements/:id/reject')
  @RequirePlatformPermission('MANAGE_ADVERTISEMENTS')
  rejectAd(@Param('id') id: string, @Body() dto: RejectAdDto) {
    return this.platformAdminService.rejectAd(id, dto);
  }

  @Get('cuisines')
  @RequirePlatformPermission('MANAGE_CUISINES')
  getCuisines() {
    return this.platformAdminService.getCuisines();
  }
  
  @Post('cuisines')
  @RequirePlatformPermission('MANAGE_CUISINES')
  createCuisine(@Body() dto: CreateCuisineDto) {
    return this.platformAdminService.createCuisine(dto);
  }

  @Patch('cuisines/:id')
  @RequirePlatformPermission('MANAGE_CUISINES')
  updateCuisine(@Param('id') id: string, @Body() dto: UpdateCuisineDto) {
    return this.platformAdminService.updateCuisine(id, dto);
  }

  @Delete('cuisines/:id')
  @RequirePlatformPermission('MANAGE_CUISINES')
  deleteCuisine(@Param('id') id: string) {
    return this.platformAdminService.deleteCuisine(id);
  }
}