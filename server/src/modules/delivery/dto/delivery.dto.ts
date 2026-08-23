import { IsString, IsNotEmpty, MinLength, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateDeliveryPersonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;
}

export class LoginDeliveryPersonDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateLocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export enum DeliveryStatusDto {
  PICKED_UP = 'PICKED_UP',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatusDto)
  status: DeliveryStatusDto;

  @IsString()
  @IsOptional()
  failureReason?: string;
}
