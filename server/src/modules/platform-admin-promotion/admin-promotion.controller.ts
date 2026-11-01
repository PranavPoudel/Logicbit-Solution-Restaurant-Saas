import { Controller, Patch, Param, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AdminPromotionService } from './admin-promotion.service';
import { UpdatePromotionLimitsDto } from './dto/update-promotion-limit.dto';
import { ReviewPromotionDto } from './dto/review-promotion.dto';

@Controller('api/v1/platform-admin/promotions/')
export class AdminPromotionController {
  constructor(private readonly adminPromotionService: AdminPromotionService ) {}

  @Get('pending')
  async getPendingPromotions() {
    return this.adminPromotionService.getPendingPromotions();
  }

  @Patch('restaurant/:restaurantId/limits')
  async updateLimits(
    @Req() req: any, 
    @Param('restaurantId') restaurantId: string, 
    @Body() dto: UpdatePromotionLimitsDto
  ) {
    const adminId = req.user?.id || 'SYSTEM_ADMIN';
    return this.adminPromotionService.updateRestaurantLimits(adminId, restaurantId, dto);
  }

  @Patch(':couponId/review')
  async reviewPromotion(
    @Req() req: any,
    @Param('couponId') couponId: string,
    @Body() dto: ReviewPromotionDto
  ) {
    const adminId = req.user?.id || 'SYSTEM_ADMIN';
    return this.adminPromotionService.reviewPendingPromotion(adminId, couponId, dto);
  }
}