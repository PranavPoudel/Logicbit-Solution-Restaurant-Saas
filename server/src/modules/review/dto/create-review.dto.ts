import { IsInt, Min, Max, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  restaurantId: string;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
