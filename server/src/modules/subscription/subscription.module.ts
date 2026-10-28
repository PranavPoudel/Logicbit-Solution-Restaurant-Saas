import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionCronService } from './subscription-cron.service';
import { RestaurantSubscriptionController, PlatformSubscriptionController } from './subscription.controller';

@Module({
  controllers: [RestaurantSubscriptionController, PlatformSubscriptionController],
  providers: [SubscriptionService, SubscriptionCronService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
