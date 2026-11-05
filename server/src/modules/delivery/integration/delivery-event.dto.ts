import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, IsUrl, MaxLength, ValidateNested } from 'class-validator';

class DeliveryDriverDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicle?: string;
}

export class DeliveryEventDto {
  @IsUUID()
  orderId: string;

  @IsIn(['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FAILED'])
  event: 'ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'FAILED';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  externalRef?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryDriverDto)
  driver?: DeliveryDriverDto;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  trackingUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  failureReason?: string;
}
