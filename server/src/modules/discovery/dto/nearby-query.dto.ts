import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsBoolean, Min, Max } from 'class-validator';

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(50)
  @IsOptional()
  radiusKm?: number = 5;

  @IsString()
  @IsOptional()
  cuisineType?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @IsString()
  @IsOptional()
  priceRange?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isOpenNow?: boolean;

  @IsString()
  @IsOptional()
  sortBy?: 'recommended' | 'rating' | 'distance' = 'recommended';

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 20;
}
