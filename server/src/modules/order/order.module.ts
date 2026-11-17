import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController, RestaurantOrderController } from './order.controller';
import { CouponModule } from '../coupon/coupon.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { UnpaidOrderExpiryService } from './unpaid-order-expiry.service';

@Module({
  imports: [
    forwardRef(() => PaymentModule),
    CouponModule,
    DeliveryModule,
    ],
  controllers: [OrderController, RestaurantOrderController],
  providers: [OrderService, UnpaidOrderExpiryService],
  exports: [OrderService],
})
export class OrderModule {}
