import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID, MaxLength } from 'class-validator';

export class CreateCuisineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}

export class UpdateCuisineDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;

  isActive?: boolean;
}

export class SetRestaurantCuisinesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  cuisineIds: string[];
}
