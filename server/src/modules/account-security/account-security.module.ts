import { Module } from '@nestjs/common';
import { AccountSecurityService } from './account-security.service';
import { OtpService } from './otp.service';

/** NotificationService and ActivityLogService are global modules, so they need no import here. */
@Module({
  providers: [AccountSecurityService, OtpService],
  exports: [AccountSecurityService],
})
export class AccountSecurityModule {}
