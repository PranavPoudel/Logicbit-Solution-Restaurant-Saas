import { IsUUID, IsArray, ValidateNested, ArrayMinSize, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemInputDto } from './order-item-input.dto';

export enum OrderTypeDto {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  DINE_IN = 'DINE_IN',
}

export enum PaymentMethodDto {
  COD = 'COD',
  CREDIT_CARD = 'CREDIT_CARD',
  ESEWA = 'ESEWA',
  KHALTI = 'KHALTI',
  IPS = 'IPS',
  PHONEPAY = 'PHONEPAY',
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsEnum(OrderTypeDto)
  orderType: OrderTypeDto;

  @IsEnum(PaymentMethodDto)
  @IsOptional()
  paymentMethod?: PaymentMethodDto = PaymentMethodDto.COD;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @IsNumber()
  @IsOptional()
  deliveryLatitude?: number;

  @IsNumber()
  @IsOptional()
  deliveryLongitude?: number;
}
