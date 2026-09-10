import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCuisineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}