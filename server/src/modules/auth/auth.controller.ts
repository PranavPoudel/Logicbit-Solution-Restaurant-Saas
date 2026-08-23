import { Controller, Post, Body, Get, Patch, Param, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, InviteStaffDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 1 मिनेटमा 5 पटक मात्र — automated bot registration रोक्न
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 1 मिनेटमा 10 पटक मात्र — brute-force password guessing रोक्न
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
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
