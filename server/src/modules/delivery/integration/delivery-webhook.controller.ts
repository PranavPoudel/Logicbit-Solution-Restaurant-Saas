import { Body, Controller, Headers, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { DeliveryIntegrationService } from './delivery-integration.service';
import type { WebhookHeaders } from './delivery-provider';

@ApiTags('Delivery - External Provider Webhooks')
@Controller('api/v1/delivery-webhooks')
export class DeliveryWebhookController {
  constructor(private readonly integration: DeliveryIntegrationService) {}

  /** Uber Direct: every restaurant gives Uber its own address, so Uber's updates are checked against that restaurant's signing key. */
  @Post('uber/:restaurantId')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  handleUber(@Param('restaurantId', ParseUUIDPipe) restaurantId: string, @Headers() headers: WebhookHeaders, @Req() req: RawBodyRequest<Request>, @Body() payload: unknown) {
    return this.integration.handleUber(restaurantId, headers, req.rawBody, payload);
  }

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  handle(@Param('provider') provider: string, @Headers() headers: WebhookHeaders, @Req() req: RawBodyRequest<Request>, @Body() payload: unknown) {
    return this.integration.handle(provider, headers, req.rawBody, payload);
  }
}
