import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionActiveGuard } from '../subscription/guards/subscription-active.guard';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';
import { SettlementService } from './settlement.service';
import { GenerateSettlementDto, MarkSettlementPaidDto } from './dto/settlement.dto';

@ApiTags('Settlement - Restaurant Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionActiveGuard)
@Controller('api/v1/restaurants/:restaurantId/settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  findAll(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.settlementService.findAllForRestaurant(req.user.tenantId, restaurantId);
  }

  @Get('outstanding')
  getOutstanding(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.settlementService.getOutstandingSummary(req.user.tenantId, restaurantId);
  }
}

@ApiTags('Settlement - Platform Admin')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin/settlements')
export class PlatformSettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post('restaurants/:restaurantId/generate')
  @RequirePlatformPermission('MANAGE_SETTLEMENTS')
  generate(@Param('restaurantId') restaurantId: string, @Body() dto: GenerateSettlementDto) {
    return this.settlementService.generateForRestaurant(restaurantId, dto.periodStart, dto.periodEnd);
  }

  @Get('pending')
  @RequirePlatformPermission('MANAGE_SETTLEMENTS')
  listPending() {
    return this.settlementService.listPending();
  }

  @Patch(':id/mark-paid')
  @RequirePlatformPermission('MANAGE_SETTLEMENTS')
  markPaid(@Param('id') id: string, @Body() dto: MarkSettlementPaidDto) {
    return this.settlementService.markAsPaid(id, dto.paymentReference);
  }
}
