import { Controller, Post, Body, Get, Patch, Param, HttpCode, HttpStatus, UseGuards, Request, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, InviteStaffDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AccountSecurityService, RequestCtx } from '../account-security/account-security.service';
import { EmailDto, ResetPasswordDto, VerifyEmailDto } from '../account-security/dto/account-security.dto';

const requestCtx = (req: ExpressRequest): RequestCtx => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly security: AccountSecurityService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 1 मिनेटमा 5 पटक मात्र — automated bot registration रोक्न
  register(@Body() dto: RegisterDto, @Req() req: ExpressRequest) {
    return this.authService.register(dto, requestCtx(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 1 मिनेटमा 10 पटक मात्र — brute-force password guessing रोक्न
  login(@Body() dto: LoginDto, @Req() req: ExpressRequest) {
    return this.authService.login(dto, requestCtx(req));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: ExpressRequest) {
    return this.security.verifyEmail('OWNER', dto.email, dto.code, requestCtx(req));
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resendVerification(@Body() dto: EmailDto, @Req() req: ExpressRequest) {
    return this.security.resendVerification('OWNER', dto.email, requestCtx(req));
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  forgotPassword(@Body() dto: EmailDto, @Req() req: ExpressRequest) {
    return this.security.forgotPassword('OWNER', dto.email, requestCtx(req));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: ExpressRequest) {
    return this.security.resetPassword('OWNER', dto.email, dto.code, dto.newPassword, requestCtx(req));
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logoutAll(@Request() req) {
    return this.security.logoutAll('OWNER', req.user.id, requestCtx(req));
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return { success: true, data: { user: req.user } };
  }

  // ---- Staff Management (Owner-only) ----
  @Post('staff')
  @UseGuards(JwtAuthGuard)
  inviteStaff(@Request() req, @Body() dto: InviteStaffDto) {
    return this.authService.inviteStaff(req.user.tenantId, dto);
  }

  @Get('staff')
  @UseGuards(JwtAuthGuard)
  findAllStaff(@Request() req) {
    return this.authService.findAllStaff(req.user.tenantId);
  }

  @Patch('staff/:userId/deactivate')
  @UseGuards(JwtAuthGuard)
  deactivateStaff(@Request() req, @Param('userId') userId: string) {
    return this.authService.deactivateStaff(req.user.tenantId, userId);
  }
}
