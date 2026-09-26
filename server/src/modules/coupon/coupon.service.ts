// modules/coupon/coupons.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { generateCouponCode } from '../../common/utils/coupon-generator.util';

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, restaurantId: string, dto: CreateCouponDto) {
    const code = (dto.code || generateCouponCode()).toUpperCase();
    const existing = await this.prisma.coupon.findFirst({ where: { tenantId, code, deletedAt: null } });
    if (existing) throw new ConflictException(`Coupon code "${code}" already exists`);

    return this.prisma.coupon.create({
      data: {
        tenantId,
        restaurantId,
        code,
        type: dto.type as any,
        value: dto.value,
        maxDiscount: dto.maxDiscount,
        minOrderAmount: dto.minOrderAmount ?? 0,
        usageLimit: dto.usageLimit,
        usageLimitPerCustomer: dto.usageLimitPerCustomer ?? 1,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
    });
  }

  async findAll(tenantId: string, restaurantId: string, includeDeleted = false) {
    return this.prisma.coupon.findMany({ 
      where: { 
        tenantId, 
        restaurantId,
        deletedAt: includeDeleted ? { not: null } : null,
      }, 
      orderBy: { createdAt: 'desc' } 
    });
  }

  async findOne(tenantId: string, restaurantId: string, id: string) {
    const coupon = await this.prisma.coupon.findFirst({ where: { id, tenantId, restaurantId, deletedAt: null } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(tenantId: string, restaurantId: string, id: string, dto: UpdateCouponDto) {
    await this.findOne(tenantId, restaurantId, id);
    await this.prisma.coupon.update({
      where: { id, tenantId, restaurantId },
      data: {
        ...dto,
        type: dto.type as any,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
    return this.findOne(tenantId, restaurantId, id);
  }

  async remove(tenantId: string, restaurantId: string, id: string) {
    await this.findOne(tenantId, restaurantId, id);
    return this.prisma.coupon.update({ 
      where: { id, tenantId, restaurantId }, 
      data: { deletedAt: new Date(), isActive: false } 
    });
  }

  async restore(tenantId: string, restaurantId: string, id: string) {
    return this.prisma.coupon.update({
      where: { id, tenantId, restaurantId, deletedAt: { not: null } },
      data: { deletedAt: null, isActive: true },
    });
  }

  async permanentDelete(tenantId: string, restaurantId: string, id: string) {
    return this.prisma.coupon.delete({ where: { id, tenantId, restaurantId } });
  }

  async validateAndCalculate(restaurantId: string, customerId: string, code: string, orderSubtotal: number) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), isActive: true, deletedAt: null, OR: [{ restaurantId }, { restaurantId: null }] },
    });
    if (!coupon) throw new NotFoundException('Invalid or expired coupon code');

    const now = new Date();
    if (coupon.validFrom > now) throw new BadRequestException('This coupon is not active yet');
    if (coupon.validUntil && coupon.validUntil < now) throw new BadRequestException('This coupon has expired');
    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
      throw new BadRequestException(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }
    if (coupon.usageLimitPerCustomer) {
      const customerUsageCount = await this.prisma.couponUsage.count({ where: { couponId: coupon.id, customerId } });
      if (customerUsageCount >= coupon.usageLimitPerCustomer) {
        throw new BadRequestException('You have already used this coupon the maximum allowed times');
      }
    }

    let discount = coupon.type === 'PERCENTAGE' ? (orderSubtotal * coupon.value) / 100 : coupon.value;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
    discount = Math.min(discount, orderSubtotal);

    return { coupon, discountAmount: Number(discount.toFixed(2)) };
  }

  async recordUsage(couponId: string, customerId: string, orderId: string, discountAmount: number) {
    await this.prisma.$transaction([
      this.prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } }),
      this.prisma.couponUsage.create({ data: { couponId, customerId, orderId, discountAmount } }),
    ]);
  }
}