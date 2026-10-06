import { IsUUID, IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class ValidateCouponDto {
  @IsUUID()
  restaurantId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsPositive()
  subtotal: number;
}
