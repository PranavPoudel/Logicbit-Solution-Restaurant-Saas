import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionPaymentService } from './subscription-payment.service';
import { CheckoutDto } from './dto/checkout.dto';

@ApiTags('Subscription Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/subscription-payments')
export class SubscriptionPaymentController {
  constructor(private readonly service: SubscriptionPaymentService) {}

  @Get('plans')
  plans() {
    return this.service.plans();
  }

  @Post('checkout')
  checkout(@Req() req, @Param('restaurantId', ParseUUIDPipe) restaurantId: string, @Body() dto: CheckoutDto) {
    return this.service.createCheckout(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  history(@Req() req, @Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.service.history(req.user.tenantId, restaurantId);
  }
}

@ApiTags('Subscription Payments')
@Controller('api/v1/subscription-payments/webhooks')
export class SubscriptionPaymentWebhookController {
  constructor(private readonly service: SubscriptionPaymentService) {}

  @Post(':method')
  @HttpCode(HttpStatus.OK)
  webhook(@Param('method') method: string, @Body() payload: any, @Headers('x-signature') signature?: string) {
    return this.service.handleWebhook(method, payload, signature);
  }
}
