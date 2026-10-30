import { Module } from '@nestjs/common';
import { CustomerEmailController } from './customer-email.controller';
import { CustomerEmailService } from './customer-email.service';
import { UnsubscribeController } from './unsubscribe.controller';

@Module({
  controllers: [CustomerEmailController, UnsubscribeController],
  providers: [CustomerEmailService],
})
export class CustomerEmailModule {}
