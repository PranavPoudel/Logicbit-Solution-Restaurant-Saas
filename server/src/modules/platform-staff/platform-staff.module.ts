import { Module } from '@nestjs/common';
import { PlatformStaffService } from './platform-staff.service';
import { PlatformStaffController } from './platform-staff.controller';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';

@Module({
  imports: [PlatformAuthModule],
  controllers: [PlatformStaffController],
  providers: [PlatformStaffService],
})
export class PlatformStaffModule {}
