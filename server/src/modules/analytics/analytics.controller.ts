//src/modules/analytics/analytics.controller.ts
import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service'; 

@ApiTags('Analytics (Owner)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/analytics')
export class AnalyticsController {
 
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(@Req() req, @Param('restaurantId') restaurantId: string) {
    // req.user is populated by JwtAuthGuard and contains the tenantId
    const tenantId = req.user.tenantId;
    return this.analyticsService.getRestaurantAnalytics(tenantId, restaurantId);
  }
}