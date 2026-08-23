import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerJwtAuthGuard } from '../customer-auth/guards/customer-jwt-auth.guard';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@ApiTags('Coupons - Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateCouponDto) {
    return this.couponService.create(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  findAll(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.couponService.findAll(req.user.tenantId, restaurantId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.couponService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.couponService.remove(req.user.tenantId, restaurantId, id);
  }
}

/**
 * "Apply Coupon" preview endpoint — checkout page मा customer ले coupon
 * code हाल्दा, order confirm नगरी नै discount कति हुन्छ भनेर देखाउन।
 */
@ApiTags('Coupons - Customer')
@ApiBearerAuth()
@UseGuards(CustomerJwtAuthGuard)
@Controller('api/v1/coupons')
export class CouponApplyController {
  constructor(private readonly couponService: CouponService) {}

  @Get('validate')
  validate(
    @Req() req,
    @Query('restaurantId') restaurantId: string,
    @Query('code') code: string,
    @Query('subtotal') subtotal: string,
  ) {
    return this.couponService.validateAndCalculate(restaurantId, req.user.id, code, Number(subtotal));
  }
}
