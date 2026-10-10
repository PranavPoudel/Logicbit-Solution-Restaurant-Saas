import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CodProvider } from './providers/cod.provider';
import { CreditCardProvider, EsewaProvider, KhaltiProvider, IpsProvider, PhonePayProvider, PayPayProvider } from './providers/future-providers.stub';

@Module({
  providers: [PaymentService, CodProvider, CreditCardProvider, EsewaProvider, KhaltiProvider, IpsProvider, PhonePayProvider, PayPayProvider],
  exports: [PaymentService],
})
export class PaymentModule {}
