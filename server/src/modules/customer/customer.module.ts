import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
  imports: [CustomerAuthModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
