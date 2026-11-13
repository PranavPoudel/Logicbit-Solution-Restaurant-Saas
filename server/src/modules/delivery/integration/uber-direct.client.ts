import { toE164 } from '../../../common/utils/phone.util';
import { BookableOrder, CourierBooking } from './delivery-provider';

interface UberDirectConfig {
  clientId?: string;
  clientSecret?: string;
  customerId?: string;
  apiUrl: string;
  authUrl: string;
}

export class UberDirectClient {
  // shortcut: a token Uber revokes keeps failing until the owner re-saves the account or the server restarts, add a retry on 401 if that happens
  private token?: { value: string; expiresAt: number };

  constructor(
    private readonly config: () => UberDirectConfig,
    private readonly http: typeof fetch = fetch,
  ) {}

  /** Asks Uber for a brand new token, which fails when Uber does not accept the credentials. */
  async verify() {
    this.token = undefined;
    await this.accessToken(this.config());
  }

  configured() {
    const { clientId, clientSecret, customerId } = this.config();
    return !!(clientId && clientSecret && customerId);
  }

  private async accessToken(cfg: UberDirectConfig) {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;

    const res = await this.http(`${cfg.authUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cfg.clientId as string,
        client_secret: cfg.clientSecret as string,
        grant_type: 'client_credentials',
        scope: 'eats.deliveries',
      }),
    });
    if (!res.ok) throw new Error(`Uber Direct token request failed (${res.status})`);
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return this.token.value;
  }

  private async post(cfg: UberDirectConfig, path: string, body: unknown) {
    const res = await this.http(`${cfg.apiUrl}/v1/customers/${cfg.customerId}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await this.accessToken(cfg)}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Uber Direct ${path} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
    return (await res.json()) as { id: string; tracking_url?: string };
  }

  async book(order: BookableOrder): Promise<CourierBooking | null> {
    if (!this.configured()) return null;
    const cfg = this.config();
    const pickupAddress = order.restaurant.address;
    if (!pickupAddress || !order.deliveryAddress) throw new Error('Missing pickup or dropoff address for the courier booking');

    // Uber needs both phone numbers in international form. A customer's number is assumed to be in the restaurant's country.
    const pickupPhone = toE164(order.restaurant.phone, order.restaurant.country);
    const dropoffPhone = toE164(order.customer.phone, order.restaurant.country);
    const unusable = [!pickupPhone && 'restaurant', !dropoffPhone && 'customer'].filter(Boolean);
    if (unusable.length) throw new Error(`Uber Direct needs a phone number in international form: the ${unusable.join(' and ')} phone is missing or not valid`);

    // Map coordinates help Uber place both addresses exactly (some regions require them).
    const coordinates = {
      ...(order.restaurant.latitude != null && order.restaurant.longitude != null && { pickup_latitude: order.restaurant.latitude, pickup_longitude: order.restaurant.longitude }),
      ...(order.deliveryLatitude != null && order.deliveryLongitude != null && { dropoff_latitude: order.deliveryLatitude, dropoff_longitude: order.deliveryLongitude }),
    };

    const quote = await this.post(cfg, '/delivery_quotes', { pickup_address: pickupAddress, dropoff_address: order.deliveryAddress, ...coordinates });
    const delivery = await this.post(cfg, '/deliveries', {
      quote_id: quote.id,
      pickup_name: order.restaurant.name,
      pickup_address: pickupAddress,
      pickup_phone_number: pickupPhone,
      dropoff_name: order.customer.name,
      dropoff_address: order.deliveryAddress,
      dropoff_phone_number: dropoffPhone,
      dropoff_notes: order.notes ?? undefined,
      manifest_items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, size: 'small' })),
      ...coordinates,
    });
    return { externalRef: delivery.id, trackingUrl: delivery.tracking_url };
  }
}
