import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController, RestaurantOrderController } from './order.controller';
import { CouponModule } from '../coupon/coupon.module';
import { PaymentModule } from '../payment/payment.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    forwardRef(() => PaymentModule),
    CouponModule,
    DeliveryModule,
    ],
  controllers: [OrderController, RestaurantOrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
