import { Module } from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminController } from './platform-admin.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

// 1. Import the existing modules you need
import { CuisineModule } from '../cuisine/cuisine.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AdvertisementModule } from '../advertisement/advertisement.module';
import { SettlementModule } from '../settlement/settlement.module';
import { PlatformStaffModule } from '../platform-staff/platform-staff.module';
import { RefundModule } from '../refund/refund.module';

@Module({
  imports: [
    PrismaModule, 
    ActivityLogModule,
    // 2. Add them to the imports array
    CuisineModule,
    RolesModule,
    SubscriptionModule,
    AdvertisementModule,
    SettlementModule,
    PlatformStaffModule,
    RefundModule
  ],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService], // Keep this for custom Super Admin dashboard stats
  exports: [PlatformAdminService],
})
export class PlatformAdminModule {}