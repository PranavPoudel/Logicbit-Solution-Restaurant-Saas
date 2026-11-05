// src/modules/restaurant/dto/update-restaurant.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayHoursDto } from './opening-hours.dto';

export class UpdateRestaurantDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  refundPolicy?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  priceRange?: string;

  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;

  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => DayHoursDto)
  @IsOptional()
  openingHours?: DayHoursDto[];

  @IsString()
  @IsOptional()
  @MaxLength(60)
  timezone?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  heroHeading?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  heroSubheading?: string;

  @IsBoolean()
  @IsOptional()
  supportsDelivery?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsPickup?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsDineIn?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  selfDeliveryRadiusKm?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDeliveryRadiusKm?: number;

  @IsEnum(['FREE', 'FLAT', 'PER_KM'])
  @IsOptional()
  selfDeliveryFeeType?: 'FREE' | 'FLAT' | 'PER_KM';

  @IsNumber()
  @Min(0)
  @IsOptional()
  selfDeliveryFlatFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  selfDeliveryPerKmFee?: number;

  @IsEnum(['FREE', 'FLAT', 'PER_KM'])
  @IsOptional()
  thirdPartyFeeType?: 'FREE' | 'FLAT' | 'PER_KM';

  @IsNumber()
  @Min(0)
  @IsOptional()
  thirdPartyBaseFee?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  thirdPartyPerKmFee?: number;

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsString()
  @IsOptional()
  locale?: string;

  @IsString()
  @IsOptional()
  currencyCode?: string;

    @IsString()
  @IsOptional()
  paypayMerchantId?: string;

  @IsString()
  @IsOptional()
  paypayApiKey?: string;

  @IsString()
  @IsOptional()
  paypayApiSecret?: string;

  @IsBoolean()
  @IsOptional()
  supportsCod?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsCreditCard?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsEsewa?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsKhalti?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsIps?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsPhonePay?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsPaypay?: boolean;
}
