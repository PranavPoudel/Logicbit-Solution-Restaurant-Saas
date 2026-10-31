import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryService } from '../delivery.service';
import { BookableOrder, DeliveryProvider, GenericDeliveryProvider, WebhookHeaders } from './delivery-provider';
import { UberDirectClient } from './uber-direct.client';
import { UberDirectProvider } from './uber-direct.provider';

@Injectable()
export class DeliveryIntegrationService {
  private readonly logger = new Logger(DeliveryIntegrationService.name);
  private readonly providers = new Map<string, DeliveryProvider>();

  constructor(
    config: ConfigService,
    private readonly deliveries: DeliveryService,
  ) {
    this.register(new GenericDeliveryProvider(() => config.get<string>('DELIVERY_WEBHOOK_SECRET')));
    this.register(
      new UberDirectProvider(
        () => config.get<string>('UBER_DIRECT_SIGNING_KEY'),
        new UberDirectClient(() => ({
          clientId: config.get<string>('UBER_DIRECT_CLIENT_ID'),
          clientSecret: config.get<string>('UBER_DIRECT_CLIENT_SECRET'),
          customerId: config.get<string>('UBER_DIRECT_CUSTOMER_ID'),
          apiUrl: config.get<string>('UBER_DIRECT_API_URL') ?? 'https://api.uber.com',
          authUrl: config.get<string>('UBER_DIRECT_AUTH_URL') ?? 'https://auth.uber.com',
        })),
      ),
    );
  }

  register(provider: DeliveryProvider) {
    this.providers.set(provider.name, provider);
  }

  async handle(providerName: string, headers: WebhookHeaders, rawBody: Buffer | undefined, payload: unknown) {
    const provider = this.providers.get(providerName);
    if (!provider) throw new NotFoundException('Unknown delivery provider');
    if (!provider.authenticate(headers, rawBody)) throw new UnauthorizedException('Invalid delivery provider credentials');

    const event = provider.parse(payload);
    if (!event) return { success: true, ignored: true };
    return this.deliveries.applyExternalEvent(provider.name, event);
  }

  async requestCourier(order: BookableOrder) {
    for (const provider of this.providers.values()) {
      if (!provider.book) continue;
      try {
        const booking = await provider.book(order);
        if (!booking) continue;
        await this.deliveries.recordBooking(order.id, booking);
        return true;
      } catch (err) {
        this.logger.error(`Courier booking via ${provider.name} failed for order ${order.orderNumber}`, err as Error);
      }
    }
    return false;
  }
}
