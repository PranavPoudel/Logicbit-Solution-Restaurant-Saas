import { IsNumber, IsOptional, IsArray, IsEnum } from 'class-validator';
import { CouponType } from '@prisma/client';

export class UpdatePromotionLimitsDto {
@IsOptional()
  @IsNumber()
  maxActivePromotions?: number;

  @IsOptional()
  @IsNumber()
  maxDiscountCap?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(CouponType, { each: true })
  allowedCouponTypes?: CouponType[];

  @IsOptional()
  @IsNumber()
  maxActiveBanners?: number;

  @IsOptional()
  @IsNumber()
  maxActivePopups?: number;
}