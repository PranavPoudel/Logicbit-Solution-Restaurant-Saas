import { Injectable } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.interface';
import { CodProvider } from './providers/cod.provider';
import { CreditCardProvider, EsewaProvider, KhaltiProvider, IpsProvider, PhonePayProvider, PayPayProvider } from './providers/future-providers.stub';

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

  async initiate(method: string, orderId: string, amount: number, currencyCode: string) {
    return this.getProvider(method).initiate(orderId, amount, currencyCode);
  }
}
