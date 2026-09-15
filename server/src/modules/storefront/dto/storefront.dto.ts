import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsArray, IsUUID, Min, MaxLength, IsObject } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  subtitle?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBannerDto {
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  subtitle?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * ReorderBannersDto — Frontend मा owner ले drag-and-drop गरेपछि, नयाँ
 * क्रममा भएका सबै banner ID यही array मा (नयाँ क्रम अनुसार) पठाइन्छ।
 */
export class ReorderBannersDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedBannerIds: string[];
}

export class UpdateStorefrontConfigDto {
  @IsString()
  @IsOptional()
  aboutText?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
  
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactAddress?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsArray()
  @IsOptional()
  sectionSettings?: any[]; // 🆕 Allow array of section setting objects
}

export class CreatePopupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsString()
  @IsOptional()
  ctaLink?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePopupDto extends CreatePopupDto {}
