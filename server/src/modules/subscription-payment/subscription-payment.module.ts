import { Module } from '@nestjs/common';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SubscriptionPaymentController, SubscriptionPaymentWebhookController } from './subscription-payment.controller';
import { SubscriptionPaymentService } from './subscription-payment.service';
import { CardSubscriptionProvider, PayPaySubscriptionProvider } from './providers/future-subscription-providers.stub';

@Module({
  imports: [SubscriptionModule],
  controllers: [SubscriptionPaymentController, SubscriptionPaymentWebhookController],
  providers: [SubscriptionPaymentService, PayPaySubscriptionProvider, CardSubscriptionProvider],
})
export class SubscriptionPaymentModule {}
