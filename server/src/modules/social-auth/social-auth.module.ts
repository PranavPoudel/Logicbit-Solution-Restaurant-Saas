import { Module } from '@nestjs/common';
import { AccountSecurityModule } from '../account-security/account-security.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { SocialAuthController } from './social-auth.controller';
import { SocialAuthService } from './social-auth.service';

@Module({
  imports: [AccountSecurityModule, CustomerAuthModule],
  controllers: [SocialAuthController],
  providers: [SocialAuthService],
})
export class SocialAuthModule {}
