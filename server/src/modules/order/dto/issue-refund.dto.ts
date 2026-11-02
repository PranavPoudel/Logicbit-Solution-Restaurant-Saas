import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { RefundMethod } from '@prisma/client';

export class IssueRefundDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;

  @IsEnum(RefundMethod)
  method: RefundMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
