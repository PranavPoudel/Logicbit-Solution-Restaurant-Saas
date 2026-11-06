//src/modules/payment/payment.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentWebhookController } from './payment-webhook.controller';
import { CodProvider } from './providers/cod.provider';
import { EsewaProvider, KhaltiProvider, IpsProvider, PhonePayProvider } from './providers/future-providers.stub';
import { PayPayProvider } from './providers/paypay.provider';
import { StripeProvider } from './providers/stripe.provider';
import { OrderModule } from '../order/order.module'; // <-- 1. Import OrderModule

@Module({
  imports: [
    forwardRef(() => OrderModule), // <-- 2. Use forwardRef to prevent circular dependency crash
  ],
  controllers: [PaymentWebhookController],
  providers: [
    PaymentService, 
    CodProvider, 
    StripeProvider,
    EsewaProvider, 
    KhaltiProvider, 
    IpsProvider, 
    PhonePayProvider, 
    PayPayProvider
  ],
  exports: [PaymentService],
})
export class PaymentModule {}