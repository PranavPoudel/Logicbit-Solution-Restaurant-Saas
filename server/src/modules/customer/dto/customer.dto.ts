import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsNotEmpty()
  fullAddress: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  fullAddress?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class AddFavoriteDto {
  @IsUUID()
  restaurantId: string;
}
