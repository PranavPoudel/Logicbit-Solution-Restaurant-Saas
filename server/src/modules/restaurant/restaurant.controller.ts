// src/modules/restaurant/restaurant.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestaurantService } from './restaurant.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { create } from 'domain';


@ApiTags('Restaurant (Owner)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get()
  findAll(@Req() req) {
    return this.restaurantService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.restaurantService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.update(req.user.tenantId, id, dto, req.user.isSuperAdmin === true);
  }

  /** Owner disconnects Stripe: deletes the saved key and switches card payments off. */
  @Delete(':id/stripe-key')
  removeStripeKey(@Req() req, @Param('id') id: string) {
    return this.restaurantService.removeStripeKey(req.user.tenantId, id, req.user.id, req.user.isSuperAdmin === true);
  }

@Post()
  async create(@Req() req, @Body() dto: CreateRestaurantDto) {
    // req.user is populated by JwtAuthGuard
    const tenantId = req.user.tenantId; 
    return this.restaurantService.create(tenantId, dto);
  }

}