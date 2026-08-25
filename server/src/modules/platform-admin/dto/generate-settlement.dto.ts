import { IsDateString, IsNotEmpty } from 'class-validator';

export class GenerateSettlementDto {
  @IsDateString()
  @IsNotEmpty()
  periodStart: string;

  @IsDateString()
  @IsNotEmpty()
  periodEnd: string;
}