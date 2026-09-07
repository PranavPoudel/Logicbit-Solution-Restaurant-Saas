import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @MaxLength(150)
  slug: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsBoolean()
  @IsOptional()
  isOpen?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsDelivery?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsPickup?: boolean;

  @IsBoolean()
  @IsOptional()
  supportsDineIn?: boolean;
}