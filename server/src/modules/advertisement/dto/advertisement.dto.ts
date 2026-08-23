import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber, Min, MaxLength } from 'class-validator';

export enum AdPlacementTypeDto {
  HOMEPAGE_BANNER = 'HOMEPAGE_BANNER',
  SEARCH_BOOST = 'SEARCH_BOOST',
  POPUP = 'POPUP',
}

export class CreateAdvertisementDto {
  @IsEnum(AdPlacementTypeDto)
  placementType: AdPlacementTypeDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  linkUrl?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class RejectAdvertisementDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ApproveAdvertisementDto {
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priority?: number;
}
