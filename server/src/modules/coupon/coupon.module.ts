import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController, CouponApplyController } from './coupon.controller';

@Module({
  controllers: [CouponController, CouponApplyController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
