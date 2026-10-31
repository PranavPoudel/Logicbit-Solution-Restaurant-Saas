// admin-promotion.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePromotionLimitsDto } from './dto/update-promotion-limit.dto';
import { ReviewPromotionDto } from './dto/review-promotion.dto';

@Injectable()
export class AdminPromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async updateRestaurantLimits(adminId: string, restaurantId: string, dto: UpdatePromotionLimitsDto) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(dto.maxActivePromotions !== undefined && { maxActivePromotions: dto.maxActivePromotions }),
        ...(dto.maxDiscountCap !== undefined && { maxDiscountCap: dto.maxDiscountCap }),
        ...(dto.allowedCouponTypes !== undefined && { allowedCouponTypes: dto.allowedCouponTypes }),
      }
    });

    await this.prisma.activityLog.create({
      data: {
        restaurantId,
        actorType: 'PLATFORM_ADMIN',
        actorId: adminId,
        action: 'PROMOTION_LIMITS_UPDATED',
        description: `Updated promotion limits for restaurant ${restaurant.name}`,
        metadata: dto as any
      }
    });

    return { success: true, data: updated };
  }

  async reviewPendingPromotion(adminId: string, couponId: string, dto: ReviewPromotionDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (coupon.approvalStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException('This coupon is not pending approval');
    }

    const isActive = dto.status === 'APPROVED';

    const updated = await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        approvalStatus: dto.status,
        isActive,
      }
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: coupon.tenantId,
        restaurantId: coupon.restaurantId,
        actorType: 'PLATFORM_ADMIN',
        actorId: adminId,
        action: 'PROMOTION_REVIEWED',
        description: `Promotion ${coupon.code} was ${dto.status}`,
        metadata: { couponId, status: dto.status }
      }
    });

    return { success: true, data: updated };
  }
}