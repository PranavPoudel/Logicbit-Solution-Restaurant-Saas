import { BookableOrder, CourierBooking } from './delivery-provider';

interface UberDirectConfig {
  clientId?: string;
  clientSecret?: string;
  customerId?: string;
  apiUrl: string;
  authUrl: string;
}

export class UberDirectClient {
  private token?: { value: string; expiresAt: number };

  constructor(
    private readonly config: () => UberDirectConfig,
    private readonly http: typeof fetch = fetch,
  ) {}

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

    const quote = await this.post(cfg, '/delivery_quotes', { pickup_address: pickupAddress, dropoff_address: order.deliveryAddress });
    const delivery = await this.post(cfg, '/deliveries', {
      quote_id: quote.id,
      external_id: order.id,
      pickup_name: order.restaurant.name,
      pickup_address: pickupAddress,
      pickup_phone_number: order.restaurant.phone,
      dropoff_name: order.customer.name,
      dropoff_address: order.deliveryAddress,
      dropoff_phone_number: order.customer.phone,
      dropoff_notes: order.notes ?? undefined,
      manifest_items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, size: 'small' })),
    });
    return { externalRef: delivery.id, trackingUrl: delivery.tracking_url };
  }
}
