import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min, IsDateString, IsInt, MaxLength } from 'class-validator';

export enum CouponTypeDto {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code: string;

  @IsEnum(CouponTypeDto)
  type: CouponTypeDto;

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimitPerCustomer?: number;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;
}
