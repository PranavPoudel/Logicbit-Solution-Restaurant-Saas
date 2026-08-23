import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerJwtAuthGuard } from '../customer-auth/guards/customer-jwt-auth.guard';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';
import { CustomerService } from './customer.service';
import { CreateAddressDto, UpdateAddressDto, AddFavoriteDto } from './dto/customer.dto';

@ApiTags('Customer - Self Service')
@ApiBearerAuth()
@UseGuards(CustomerJwtAuthGuard)
@Controller('api/v1/customers/me')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly customerAuthService: CustomerAuthService,
  ) {}

  // ---- Profile ----
  @Patch('profile')
  updateProfile(@Req() req, @Body() data: { name?: string; phone?: string }) {
    return this.customerAuthService.updateProfile(req.user.id, data);
  }

  @Patch('password')
  changePassword(@Req() req, @Body('currentPassword') currentPassword: string, @Body('newPassword') newPassword: string) {
    return this.customerAuthService.changePassword(req.user.id, currentPassword, newPassword);
  }

  // ---- Addresses ----
  @Post('addresses')
  addAddress(@Req() req, @Body() dto: CreateAddressDto) {
    return this.customerService.addAddress(req.user.id, dto);
  }

  @Get('addresses')
  findAllAddresses(@Req() req) {
    return this.customerService.findAllAddresses(req.user.id);
  }

  @Patch('addresses/:id')
  updateAddress(@Req() req, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.customerService.updateAddress(req.user.id, id, dto);
  }

  @Delete('addresses/:id')
  removeAddress(@Req() req, @Param('id') id: string) {
    return this.customerService.removeAddress(req.user.id, id);
  }

  // ---- Favorites ----
  @Post('favorites')
  addFavorite(@Req() req, @Body() dto: AddFavoriteDto) {
    return this.customerService.addFavorite(req.user.id, dto.restaurantId);
  }

  @Get('favorites')
  findAllFavorites(@Req() req) {
    return this.customerService.findAllFavorites(req.user.id);
  }

  @Delete('favorites/:restaurantId')
  removeFavorite(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.customerService.removeFavorite(req.user.id, restaurantId);
  }
}
