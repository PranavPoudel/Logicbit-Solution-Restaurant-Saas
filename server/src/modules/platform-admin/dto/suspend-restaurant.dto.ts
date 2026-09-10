import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SuspendRestaurantDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}