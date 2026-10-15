// src/modules/delivery/dto/delivery-partner.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DeliveryPartnerFeeType } from '@prisma/client';

export class CreateDeliveryPartnerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  accountId?: string;

  @IsOptional()
  @IsEnum(DeliveryPartnerFeeType)
  feeType?: DeliveryPartnerFeeType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  feeValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDeliveryPartnerDto extends PartialType(CreateDeliveryPartnerDto) {}
