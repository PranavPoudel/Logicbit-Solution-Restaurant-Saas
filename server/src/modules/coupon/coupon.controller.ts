// modules/coupon/coupons.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionActiveGuard } from '../subscription/guards/subscription-active.guard';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@ApiTags('Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionActiveGuard)
@Controller('api/v1/restaurants/:restaurantId/coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new coupon' })
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateCouponDto) {
    return this.couponService.create(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all coupons, optionally including deleted ones' })
  findAll(@Req() req, @Param('restaurantId') restaurantId: string, @Query('includeDeleted') includeDeleted?: string | boolean) {
    const isDeletedIncluded = includeDeleted === 'true' || includeDeleted === true;
    return this.couponService.findAll(req.user.tenantId, restaurantId, isDeletedIncluded);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single coupon by ID' })
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.couponService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon' })
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a coupon (moves to trash)' })
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.couponService.remove(req.user.tenantId, restaurantId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted coupon' })
  restore(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.couponService.restore(req.user.tenantId, restaurantId, id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a coupon' })
  permanentDelete(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.couponService.permanentDelete(req.user.tenantId, restaurantId, id);
  }
}