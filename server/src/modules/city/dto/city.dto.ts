import { IsBoolean, IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  nameJa?: string;

  @IsString()
  @Length(2, 2)
  country: string;

  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}

export class UpdateCityDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  nameJa?: string;

  @IsString()
  @Length(2, 2)
  @IsOptional()
  country?: string;

  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
