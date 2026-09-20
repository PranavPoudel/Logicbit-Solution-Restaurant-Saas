// src/modules/storefront/storefront.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorefrontService } from './storefront.service';
import { CreateBannerDto, UpdateBannerDto, ReorderBannersDto, UpdateStorefrontConfigDto, CreatePopupDto, UpdatePopupDto } from './dto/storefront.dto';

@ApiTags('Storefront - Owner (Website Builder)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  // ---- Banners ----
  @Post('banners')
  createBanner(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateBannerDto) {
    return this.storefrontService.createBanner(req.user.tenantId, restaurantId, dto);
  }

  @Get('banners')
  findAllBanners(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.storefrontService.findAllBanners(req.user.tenantId, restaurantId);
  }

  @Patch('banners/:id')
  updateBanner(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.storefrontService.updateBanner(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete('banners/:id')
  removeBanner(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.storefrontService.removeBanner(req.user.tenantId, restaurantId, id);
  }

  /** Drag-and-drop पछि नयाँ क्रम save गर्ने endpoint */
  @Patch('banners/reorder')
  reorderBanners(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: ReorderBannersDto) {
    return this.storefrontService.reorderBanners(req.user.tenantId, restaurantId, dto);
  }

  // ---- Config (About/Contact/Section Order) ----
  @Get('config')
  getConfig(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.storefrontService.getConfig(req.user.tenantId, restaurantId);
  }

  @Patch('config')
  updateConfig(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: UpdateStorefrontConfigDto) {
    return this.storefrontService.updateConfig(req.user.tenantId, restaurantId, dto);
  }

  // ---- Popup (Offer/Notification) ----
  @Post('popups')
  createPopup(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreatePopupDto) {
    return this.storefrontService.createPopup(req.user.tenantId, restaurantId, dto);
  }

  @Get('popups')
  findAllPopups(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.storefrontService.findAllPopups(req.user.tenantId, restaurantId);
  }

  @Patch('popups/:id')
  updatePopup(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdatePopupDto) {
    return this.storefrontService.updatePopup(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete('popups/:id')
  removePopup(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.storefrontService.removePopup(req.user.tenantId, restaurantId, id);
  }
}

@ApiTags('Storefront - Public')
@Controller('api/v1/discovery/restaurants/:restaurantId/storefront')
export class PublicStorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get()
  getPublic(@Param('restaurantId') restaurantId: string) {
    return this.storefrontService.getPublicStorefront(restaurantId);
  }

  @Get('popup')
  getActivePopup(@Param('restaurantId') restaurantId: string) {
    return this.storefrontService.getActivePopup(restaurantId);
  }
}
