import { IsDateString, IsString, IsOptional } from 'class-validator';

export class GenerateSettlementDto {
  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}

export class MarkSettlementPaidDto {
  @IsString()
  @IsOptional()
  paymentReference?: string;
}
