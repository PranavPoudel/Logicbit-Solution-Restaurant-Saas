import { createHmac } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { BookableOrder, CourierBooking, DeliveryEvent, DeliveryProvider, WebhookHeaders, safeEqual } from './delivery-provider';
import { UberDirectClient } from './uber-direct.client';

interface UberCourier {
  name?: string;
  vehicle_type?: string;
  public_phone_info?: { phone_number?: string };
}

interface UberDeliveryWebhook {
  kind?: string;
  status?: string;
  delivery_id?: string;
  data?: {
    id?: string;
    status?: string;
    tracking_url?: string;
    courier?: UberCourier;
    undeliverable_reason?: string;
    cancelation_reason?: { secondary_reason?: string };
  };
}

export class UberDirectProvider implements DeliveryProvider {
  readonly name = 'uber';

  constructor(
    private readonly signingKey: () => string | undefined,
    private readonly client: UberDirectClient,
  ) {}

  authenticate(headers: WebhookHeaders, rawBody?: Buffer) {
    const key = this.signingKey();
    const given = headers['x-uber-signature'] ?? headers['x-postmates-signature'];
    if (!key || !rawBody || typeof given !== 'string') return false;
    return safeEqual(given.toLowerCase(), createHmac('sha256', key).update(rawBody).digest('hex'));
  }

  parse(payload: unknown): DeliveryEvent | null {
    if (typeof payload !== 'object' || payload === null) throw new BadRequestException('Invalid webhook body');
    const body = payload as UberDeliveryWebhook;
    if (body.kind !== 'event.delivery_status') return null;

    // The delivery is found by Uber's own delivery id, which we saved when booking.
    const externalRef = body.delivery_id ?? body.data?.id;
    if (!externalRef) return null;

    const base = { externalRef, trackingUrl: body.data?.tracking_url };
    switch (body.status ?? body.data?.status) {
      case 'pickup': {
        const courier = body.data?.courier;
        return {
          ...base,
          event: 'ASSIGNED',
          driver: { name: courier?.name, phone: courier?.public_phone_info?.phone_number, vehicle: courier?.vehicle_type },
        };
      }
      case 'pickup_complete':
        return { ...base, event: 'PICKED_UP' };
      case 'dropoff':
        return { ...base, event: 'ON_THE_WAY' };
      case 'delivered':
        return { ...base, event: 'DELIVERED' };
      case 'canceled':
      case 'returned':
        // Uber's primary_reason is always "#Uber"; the secondary one (e.g. COURIER_CANCEL) says who cancelled.
        return { ...base, event: 'FAILED', failureReason: body.data?.cancelation_reason?.secondary_reason ?? body.data?.undeliverable_reason ?? 'Uber Direct delivery was cancelled' };
      default:
        return null;
    }
  }

  book(order: BookableOrder): Promise<CourierBooking | null> {
    return this.client.book(order);
  }
}
