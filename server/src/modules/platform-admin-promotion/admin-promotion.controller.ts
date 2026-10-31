// admin-promotion.controller.ts
import { Controller, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AdminPromotionService } from './admin-promotion.service';
import { UpdatePromotionLimitsDto } from './dto/update-promotion-limit.dto';
import { ReviewPromotionDto } from './dto/review-promotion.dto';
// import { SuperAdminGuard } from '../../auth/guards/super-admin.guard'; 

@Controller('platform-admin/promotions')
export class AdminPromotionController {
  constructor(private readonly adminPromotionService: AdminPromotionService ) {}

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