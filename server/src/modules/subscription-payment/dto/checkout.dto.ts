import { IsIn, IsUUID } from 'class-validator';

export class CheckoutDto {
  @IsUUID()
  planId: string;

  @IsIn(['PAYPAY', 'CARD'])
  method: 'PAYPAY' | 'CARD';
}
