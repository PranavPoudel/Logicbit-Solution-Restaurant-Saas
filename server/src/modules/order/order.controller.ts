// src/modules/order/order.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerJwtAuthGuard } from '../customer-auth/guards/customer-jwt-auth.guard';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { UpdateOrderStatusDto, CancelOrderDto } from './dto/update-order-status.dto';

@ApiTags('Orders - Customer')
@ApiBearerAuth()
@UseGuards(CustomerJwtAuthGuard)
@Controller('api/v1/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  checkout(@Req() req, @Body() dto: CreateOrderDto) {
    return this.orderService.checkout(req.user.id, dto);
  }

  @Post('validate-coupon')
  validateCoupon(@Req() req, @Body() dto: ValidateCouponDto) {
    return this.orderService.previewCoupon(req.user.id, dto.restaurantId, dto.code, dto.subtotal);
  }

  @Get()
  findMyOrders(@Req() req) {
    return this.orderService.findAllForCustomer(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.orderService.findOneForCustomer(req.user.id, id);
  }

  @Patch(':id/cancel')
  cancel(@Req() req, @Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.orderService.cancel('CUSTOMER', req.user.id, id, dto);
  }
}

@ApiTags('Orders - Restaurant Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/orders')
export class RestaurantOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(@Req() req, @Param('restaurantId') restaurantId: string, @Query('status') status?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.orderService.findAllForRestaurant(req.user.tenantId, restaurantId, status, startDate, endDate);
  }

  @Get('unprinted') // 🆕 Fetch only orders that haven't been printed
  findUnprinted(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.orderService.findUnprintedForRestaurant(req.user.tenantId, restaurantId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.orderService.findOneForRestaurant(req.user.tenantId, restaurantId, id);
  }

  @Get(':id/email-preview')
  emailPreview(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.orderService.emailPreview(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(req.user.tenantId, restaurantId, id, dto, req.user.id);
  }

  @Patch(':id/cancel')
  cancel(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.orderService.cancel('RESTAURANT', req.user.id, id, dto); // Fixed: added restaurantId to match service if needed, or adjust service
  }

  @Patch(':id/print') // 🆕 Mark order as printed
  markPrinted(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.orderService.markAsPrinted(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id/reject-rider')
  rejectRider(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.orderService.rejectRider(req.user.tenantId, restaurantId, id);
  }
}
