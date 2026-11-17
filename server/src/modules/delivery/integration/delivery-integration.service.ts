import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryService } from '../delivery.service';
import { BookableOrder, DeliveryProvider, GenericDeliveryProvider, WebhookHeaders } from './delivery-provider';
import { UberDirectAccountService } from './uber-direct-account.service';
import { UberDirectProvider } from './uber-direct.provider';

@Injectable()
export class DeliveryIntegrationService {
  private readonly logger = new Logger(DeliveryIntegrationService.name);
  private readonly providers = new Map<string, DeliveryProvider>();

  constructor(
    config: ConfigService,
    private readonly deliveries: DeliveryService,
    private readonly uberAccounts: UberDirectAccountService,
  ) {
    this.register(new GenericDeliveryProvider(() => config.get<string>('DELIVERY_WEBHOOK_SECRET')));
  }

  /** The restaurant's own Uber Direct account as a provider, or null when it has none. */
  private async uberFor(restaurantId: string) {
    const account = await this.uberAccounts.forRestaurant(restaurantId);
    return account ? new UberDirectProvider(() => account.signingKey, account.client) : null;
  }

  /** Uber calls a different address for every restaurant, and only that restaurant's signing key is accepted. */
  async handleUber(restaurantId: string, headers: WebhookHeaders, rawBody: Buffer | undefined, payload: unknown) {
    const provider = await this.uberFor(restaurantId);
    if (!provider || !provider.authenticate(headers, rawBody)) throw new UnauthorizedException('Invalid delivery provider credentials');

    const event = provider.parse(payload);
    if (!event) return { success: true, ignored: true };
    return this.deliveries.applyExternalEvent(provider.name, event, restaurantId);
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
    let uber: UberDirectProvider | null = null;
    try {
      uber = await this.uberFor(order.restaurant.id);
    } catch (err) {
      this.logger.error(`Could not load the Uber Direct account for order ${order.orderNumber}`, err as Error);
    }

    for (const provider of [...this.providers.values(), ...(uber ? [uber] : [])]) {
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
