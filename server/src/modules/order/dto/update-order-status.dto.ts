// src/modules/order/dto/update-order-status.dto.ts
import { IsEnum, IsString, IsOptional } from 'class-validator';

export enum OrderStatusDto {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusDto)
  status: OrderStatusDto;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CancelOrderDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
