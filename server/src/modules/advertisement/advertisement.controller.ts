//src/modules/advertisement/advertisement.controller.ts
import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionActiveGuard } from '../subscription/guards/subscription-active.guard';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';
import { AdvertisementService } from './advertisement.service';
import { CreateAdvertisementDto, ApproveAdvertisementDto, RejectAdvertisementDto } from './dto/advertisement.dto';

@ApiTags('Advertisement - Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionActiveGuard)
@Controller('api/v1/restaurants/:restaurantId/advertisements')
export class AdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Post()
  requestAd(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateAdvertisementDto) {
    return this.advertisementService.requestAd(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  findMyAds(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.advertisementService.findMyAds(req.user.tenantId, restaurantId);
  }
}

@ApiTags('Advertisement - Platform Admin')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin/advertisements')
export class PlatformAdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Get('pending')
  @RequirePlatformPermission('MANAGE_ADVERTISEMENTS')
  listPending() {
    return this.advertisementService.listPendingAds();
  }

  @Patch(':id/approve')
  @RequirePlatformPermission('MANAGE_ADVERTISEMENTS')
  approve(@Param('id') id: string, @Body() dto: ApproveAdvertisementDto) {
    return this.advertisementService.approveAd(id, dto);
  }

  @Patch(':id/reject')
  @RequirePlatformPermission('MANAGE_ADVERTISEMENTS')
  reject(@Param('id') id: string, @Body() dto: RejectAdvertisementDto) {
    return this.advertisementService.rejectAd(id, dto);
  }
}

@ApiTags('Advertisement - Public')
@Controller('api/v1/discovery/advertisements')
export class PublicAdvertisementController {
  constructor(private readonly advertisementService: AdvertisementService) {}

  @Get('homepage-banners')
  getHomepageBanners() {
    return this.advertisementService.getHomepageBanners();
  }

  @Get('popup')
  getPopupAd() {
    return this.advertisementService.getPopupAd();
  }
}
