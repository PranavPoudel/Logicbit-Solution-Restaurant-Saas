import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCuisineDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}