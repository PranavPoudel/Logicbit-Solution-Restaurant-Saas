import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { CustomerAuthService } from './customer-auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';

@ApiTags('Customer Auth (Public)')
@Controller('api/v1/customer-auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterCustomerDto) {
    return this.customerAuthService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginCustomerDto) {
    return this.customerAuthService.login(dto);
  }

  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  guest(@Body('name') name: string, @Body('phone') phone: string) {
    return this.customerAuthService.createGuestSession(name, phone);
  }
}
