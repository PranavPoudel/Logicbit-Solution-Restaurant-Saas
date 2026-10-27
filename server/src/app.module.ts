import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerAuthModule } from './modules/customer-auth/customer-auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { MenuModule } from './modules/menu/menu.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { PaymentModule } from './modules/payment/payment.module';
import { OrderModule } from './modules/order/order.module';
import { ReviewModule } from './modules/review/review.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TranslationModule } from './modules/translation/translation.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { AdvertisementModule } from './modules/advertisement/advertisement.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { CuisineModule } from './modules/cuisine/cuisine.module';
import { CityModule } from './modules/city/city.module';
import { PlatformAuthModule } from './modules/platform-auth/platform-auth.module';
import { PlatformStaffModule } from './modules/platform-staff/platform-staff.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TablesModule } from './modules/tables/tables.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { ChatsModule } from './modules/chats/chats.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // Cron job (subscription expiry check) चलाउन आवश्यक

    // Rate limiting — brute-force (login/register) र API abuse बाट जोगाउने।
    // Default: 60 seconds भित्र 100 request प्रति IP। Auth endpoint जस्ता
    // sensitive route मा थप strict limit चाहिए @Throttle() decorator ले
    // per-route override गर्न सकिन्छ।
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    PrismaModule,
    ActivityLogModule,
    TranslationModule,
    NotificationModule,

    AuthModule,
    CustomerAuthModule,
    RolesModule,
    PermissionsModule,
    RestaurantModule,
    DiscoveryModule,
    MenuModule,
    CouponModule,
    PaymentModule,
    OrderModule,
    ReviewModule,
    MediaModule,
    PlatformAdminModule,
    StorefrontModule,
    AdvertisementModule,
    SettlementModule,
    DeliveryModule,
    CustomerModule,
    CuisineModule,
    CityModule,
    PlatformAuthModule,
    PlatformStaffModule,
    SubscriptionModule,
    AnalyticsModule,
    TablesModule,
    ReservationsModule,
    ChatsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
