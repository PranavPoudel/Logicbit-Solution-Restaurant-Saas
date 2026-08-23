import { IsString, IsNotEmpty, IsInt, IsNumber, Min, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  durationMonths: number; // 0 = Free/lifetime

  @IsNumber()
  @Min(0)
  price: number;
}

export class RenewSubscriptionDto {
  @IsUUID()
  planId: string;

  /** नयाँ expiry date manual override गर्न चाहेमा (नत्र plan.durationMonths बाट auto-calculate हुन्छ) */
  @IsOptional()
  customExpiryDate?: string;
}

export class ToggleAutoRenewDto {
  @IsBoolean()
  autoRenew: boolean;
}
