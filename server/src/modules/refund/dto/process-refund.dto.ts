import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { RefundStatus } from '@prisma/client';

export class ProcessRefundDto {
  @IsEnum(RefundStatus)
  @IsNotEmpty()
  status: RefundStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}