import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CustomerEmailService } from './customer-email.service';

class UnsubscribeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  token: string;
}

@ApiTags('Email Unsubscribe')
@Controller('api/v1/email-unsubscribe')
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class UnsubscribeController {
  constructor(private readonly service: CustomerEmailService) {}

  @Get()
  @ApiOperation({ summary: 'Which restaurant an unsubscribe link is for, and whether it is already used' })
  status(@Query('token') token = '') {
    return this.service.unsubscribeStatus(token);
  }

  @Post()
  @ApiOperation({ summary: 'Stop emails from this restaurant' })
  unsubscribe(@Body() dto: UnsubscribeDto) {
    return this.service.unsubscribe(dto.token);
  }

  @Post('resubscribe')
  @ApiOperation({ summary: 'Start getting emails from this restaurant again' })
  resubscribe(@Body() dto: UnsubscribeDto) {
    return this.service.resubscribe(dto.token);
  }
}
