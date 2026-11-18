// src/modules/payment/payment.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentCheck, PaymentContext, PaymentProvider, PaymentResume } from './payment-provider.interface';
import { CodProvider } from './providers/cod.provider';
import { EsewaProvider, KhaltiProvider, IpsProvider, PhonePayProvider } from './providers/future-providers.stub';
import { PayPayProvider } from './providers/paypay.provider';
import { StripeProvider } from './providers/stripe.provider';

@Injectable()
export class PaymentService {
  private readonly providers: Record<string, PaymentProvider>;

  constructor(
    private readonly cod: CodProvider,
    private readonly stripe: StripeProvider,
    private readonly esewa: EsewaProvider,
    private readonly khalti: KhaltiProvider,
    private readonly ips: IpsProvider,
    private readonly phonePay: PhonePayProvider,
    private readonly payPay: PayPayProvider,
  ) {
    // नयाँ gateway थप्दा यहाँ एउटा लाइन थप्ने मात्र हो।
    this.providers = {
      COD: this.cod,
      CREDIT_CARD: this.stripe,
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

  /** Whether an unpaid order of this method can be paid again and closed: only gateways whose payment pages are ours to reopen. */
  canResume(method: string): boolean {
    return !!this.providers[method]?.resume;
  }

  async resume(method: string, orderId: string): Promise<PaymentResume> {
    const provider = this.getProvider(method);
    if (!provider.resume) throw new BadRequestException('This payment method cannot be continued');
    return provider.resume(orderId);
  }

  async cancelPayment(method: string, orderId: string): Promise<{ paid: boolean }> {
    const provider = this.getProvider(method);
    return provider.cancelPayment ? provider.cancelPayment(orderId) : { paid: false };
  }

  async refund(method: string, orderId: string, amount: number, existingRefundId?: string) {
    const provider = this.getProvider(method);
    if (!provider.refund) throw new BadRequestException('Refunds through this payment method are not switched on yet');
    return provider.refund(orderId, amount, existingRefundId);
  }
}
