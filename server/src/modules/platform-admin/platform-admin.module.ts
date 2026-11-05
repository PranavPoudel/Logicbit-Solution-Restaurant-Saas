// src/modules/platform-admin/platform-admin.module.ts
import { Module } from '@nestjs/common';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformAdminController } from './platform-admin.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

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
    CuisineModule,
    RolesModule,
    SubscriptionModule,
    AdvertisementModule,
    SettlementModule,
    PlatformStaffModule,
    RefundModule
  ],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService], 
  exports: [PlatformAdminService],
})
export class PlatformAdminModule {}
