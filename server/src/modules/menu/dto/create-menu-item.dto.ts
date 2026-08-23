import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isVegetarian?: boolean;

  @IsBoolean()
  @IsOptional()
  isVegan?: boolean;

  @IsString()
  @IsOptional()
  spiceLevel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  allergenInfo?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  calories?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  preparationTimeMinutes?: number;
}
