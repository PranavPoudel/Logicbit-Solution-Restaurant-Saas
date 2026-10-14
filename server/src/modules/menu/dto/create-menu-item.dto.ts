// modules/menu/dto/create-menu-item.dto.ts
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
  IsArray, // 🆕 Added
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
  @MaxLength(150)
  nameJa?: string; // 🆕 Japanese Name

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  descriptionJa?: string; // 🆕 Japanese Description

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryImages?: string[]; // 🆕 Array of image URLs (Prisma will store as JSON)

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

  @IsString()
  @IsOptional()
  @MaxLength(500)
  ingredients?: string;

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  homepageSections?: string[]; // 🆕 e.g., ["TODAYS_SPECIAL", "BEST_SELLER"] (Prisma stores as JSON)
}