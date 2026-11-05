// src/modules/payment/payment.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentCheck, PaymentContext, PaymentProvider } from './payment-provider.interface';
import { CodProvider } from './providers/cod.provider';
import { CreditCardProvider, EsewaProvider, KhaltiProvider, IpsProvider, PhonePayProvider } from './providers/future-providers.stub';
import { PayPayProvider } from './providers/paypay.provider';

@Injectable()
export class PaymentService {
  private readonly providers: Record<string, PaymentProvider>;

  constructor(
    private readonly cod: CodProvider,
    private readonly creditCard: CreditCardProvider,
    private readonly esewa: EsewaProvider,
    private readonly khalti: KhaltiProvider,
    private readonly ips: IpsProvider,
    private readonly phonePay: PhonePayProvider,
    private readonly payPay: PayPayProvider,
  ) {
    // नयाँ gateway थप्दा यहाँ एउटा लाइन थप्ने मात्र हो।
    this.providers = {
      COD: this.cod,
      CREDIT_CARD: this.creditCard,
      ESEWA: this.esewa,
      KHALTI: this.khalti,
      IPS: this.ips,
      PHONEPAY: this.phonePay,
      PAYPAY: this.payPay,
    };
  }

  getProvider(method: string): PaymentProvider {
    const provider = this.providers[method];
    if (!provider) throw new Error(`Unknown payment method: ${method}`);
    return provider;
  }

  async initiate(method: string, orderId: string, amount: number, currencyCode: string, context?: PaymentContext) {
    return this.getProvider(method).initiate(orderId, amount, currencyCode, context);
  }

  async checkPayment(method: string, orderId: string): Promise<PaymentCheck> {
    const provider = this.getProvider(method);
    return provider.checkPayment ? provider.checkPayment(orderId) : { paid: false };
  }

  async refund(method: string, orderId: string, amount: number, existingRefundId?: string) {
    const provider = this.getProvider(method);
    if (!provider.refund) throw new BadRequestException('Refunds through this payment method are not switched on yet');
    return provider.refund(orderId, amount, existingRefundId);
  }
}
