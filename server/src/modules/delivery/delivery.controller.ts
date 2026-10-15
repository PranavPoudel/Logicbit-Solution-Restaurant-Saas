// src/modules/delivery/delivery.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeliveryJwtAuthGuard } from './guards/delivery-jwt-auth.guard';
import { DeliveryService } from './delivery.service';
import { DeliveryPartnerService } from './delivery-partner.service';
import { CreateDeliveryPartnerDto, UpdateDeliveryPartnerDto } from './dto/delivery-partner.dto';
import { CreateDeliveryPersonDto, LoginDeliveryPersonDto, UpdateLocationDto, UpdateDeliveryStatusDto } from './dto/delivery.dto';

@ApiTags('Delivery - Owner Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/delivery-persons')
export class DeliveryPersonManagementController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateDeliveryPersonDto) {
    return this.deliveryService.createDeliveryPerson(req.user.tenantId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.deliveryService.findAllForTenant(req.user.tenantId);
  }
}

@ApiTags('Delivery - Owner Partners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/delivery-partners')
export class DeliveryPartnerController {
  constructor(private readonly partners: DeliveryPartnerService) {}

  @Get()
  findAll(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.partners.findAll(req.user.tenantId, restaurantId);
  }

  @Post()
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateDeliveryPartnerDto) {
    return this.partners.create(req.user.tenantId, restaurantId, dto);
  }

  @Patch(':id')
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateDeliveryPartnerDto) {
    return this.partners.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.partners.remove(req.user.tenantId, restaurantId, id);
  }
}

@ApiTags('Delivery - Auth (Public)')
@Controller('api/v1/delivery-auth')
export class DeliveryAuthController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  selfRegister(@Body() dto: CreateDeliveryPersonDto) {
    return this.deliveryService.selfRegister(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginDeliveryPersonDto) {
    return this.deliveryService.login(dto);
  }
}

@ApiTags('Delivery - Delivery Person')
@ApiBearerAuth()
@UseGuards(DeliveryJwtAuthGuard)
@Controller('api/v1/delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('orders/available')
  findAvailable() {
    return this.deliveryService.findAvailableOrders();
  }

  @Get('my-deliveries')
  findMyDeliveries(@Req() req) {
    return this.deliveryService.findMyDeliveries(req.user.id);
  }

  @Get('earnings')
  getEarnings(@Req() req) {
    return this.deliveryService.getEarningsSummary(req.user.id);
  }

  @Patch('orders/:orderId/accept')
  accept(@Req() req, @Param('orderId') orderId: string) {
    return this.deliveryService.acceptOrder(req.user.id, orderId);
  }

  @Patch('orders/:orderId/reject')
  reject(@Req() req, @Param('orderId') orderId: string) {
    return this.deliveryService.rejectOrder(req.user.id, orderId);
  }

  @Patch('orders/:orderId/status')
  updateStatus(@Req() req, @Param('orderId') orderId: string, @Body() dto: UpdateDeliveryStatusDto) {
    return this.deliveryService.updateStatus(req.user.id, orderId, dto);
  }

  @Patch('location')
  updateLocation(@Req() req, @Body() dto: UpdateLocationDto) {
    return this.deliveryService.updateLocation(req.user.id, dto);
  }

  @Patch('availability')
  updateAvailability(@Req() req, @Body() dto: { isAvailable: boolean }) {
    return this.deliveryService.updateAvailability(req.user.id, dto.isAvailable);
  }
}

