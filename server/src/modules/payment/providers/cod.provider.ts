import { Injectable } from '@nestjs/common';
import { PaymentProvider, PaymentInitiationResult } from '../payment-provider.interface';

/**
 * CodProvider — Cash on Delivery।
 * यहाँ कुनै external gateway चाहिँदैन — order confirm हुनेबित्तिकै
 * paymentStatus "UNPAID" राखिन्छ, र delivery भएपछि matra restaurant
 * owner ले manually "PAID" मा mark गर्छ (delivery person ले cash लिएपछि)।
 */
@Injectable()
export class CodProvider implements PaymentProvider {
  readonly methodName = 'COD';

  async initiate(): Promise<PaymentInitiationResult> {
    return { success: true, paymentStatus: 'UNPAID' };
  }
}
