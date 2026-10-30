import { Module } from '@nestjs/common';
import { CustomerEmailController } from './customer-email.controller';
import { CustomerEmailService } from './customer-email.service';

@Module({
  controllers: [CustomerEmailController],
  providers: [CustomerEmailService],
})
export class CustomerEmailModule {}
