import { timingSafeEqual } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DeliveryEventDto } from './delivery-event.dto';

type DeliveryEventType = 'ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'FAILED';

export interface DeliveryEvent {
  orderId: string;
  event: DeliveryEventType;
  externalRef?: string;
  driver?: { name?: string; phone?: string; vehicle?: string };
  trackingUrl?: string;
  failureReason?: string;
}

export interface BookableOrder {
  id: string;
  orderNumber: string;
  deliveryAddress: string | null;
  notes?: string | null;
  restaurant: { name: string; address: string | null; phone: string | null };
  customer: { name: string; phone: string | null };
  items: { quantity: number; name: string }[];
}

export interface CourierBooking {
  externalRef: string;
  trackingUrl?: string;
}

export type WebhookHeaders = Record<string, string | string[] | undefined>;

export interface DeliveryProvider {
  name: string;
  authenticate(headers: WebhookHeaders, rawBody?: Buffer): boolean;
  parse(payload: unknown): DeliveryEvent | null;
  book?(order: BookableOrder): Promise<CourierBooking | null>;
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export class GenericDeliveryProvider implements DeliveryProvider {
  readonly name = 'generic';

  constructor(private readonly secret: () => string | undefined) {}

  authenticate(headers: WebhookHeaders) {
    const expected = this.secret();
    const given = headers['x-delivery-secret'];
    return !!expected && typeof given === 'string' && safeEqual(given, expected);
  }

  parse(payload: unknown): DeliveryEvent {
    const dto = plainToInstance(DeliveryEventDto, payload);
    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) throw new BadRequestException(errors.flatMap((e) => Object.values(e.constraints ?? {})));
    return dto;
  }
}
