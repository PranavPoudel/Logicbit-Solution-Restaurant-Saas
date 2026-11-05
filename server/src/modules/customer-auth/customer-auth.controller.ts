import { Body, Controller, Post, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CustomerAuthService } from './customer-auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { AccountSecurityService, RequestCtx } from '../account-security/account-security.service';
import { EmailDto, ResetPasswordDto, VerifyEmailDto } from '../account-security/dto/account-security.dto';

const requestCtx = (req: Request): RequestCtx => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

@ApiTags('Customer Auth (Public)')
@Controller('api/v1/customer-auth')
export class CustomerAuthController {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly security: AccountSecurityService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterCustomerDto, @Req() req: Request) {
    return this.customerAuthService.register(dto, requestCtx(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginCustomerDto, @Req() req: Request) {
    return this.customerAuthService.login(dto, requestCtx(req));
  }

  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  guest(@Body('name') name: string, @Body('phone') phone: string) {
    return this.customerAuthService.createGuestSession(name, phone);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.security.verifyEmail('CUSTOMER', dto.email, dto.code, requestCtx(req));
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resendVerification(@Body() dto: EmailDto, @Req() req: Request) {
    return this.security.resendVerification('CUSTOMER', dto.email, requestCtx(req));
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPassword(@Body() dto: EmailDto, @Req() req: Request) {
    return this.security.forgotPassword('CUSTOMER', dto.email, requestCtx(req));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.security.resetPassword('CUSTOMER', dto.email, dto.code, dto.newPassword, requestCtx(req));
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomerJwtAuthGuard)
  logoutAll(@Req() req: Request & { user: { id: string } }) {
    return this.security.logoutAll('CUSTOMER', req.user.id, requestCtx(req));
  }
}
