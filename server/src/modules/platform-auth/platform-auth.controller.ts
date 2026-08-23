import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { PlatformAuthService } from './platform-auth.service';
import { LoginPlatformStaffDto } from './dto/platform-auth.dto';

@ApiTags('Platform Auth (Staff Login)')
@Controller('api/v1/platform-auth')
export class PlatformAuthController {
  constructor(private readonly platformAuthService: PlatformAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginPlatformStaffDto) {
    return this.platformAuthService.login(dto);
  }
}
