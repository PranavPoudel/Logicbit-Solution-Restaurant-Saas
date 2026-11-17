import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { decryptSecret, encryptSecret } from '../../../common/utils/secret-box.util';
import { ActivityLogService } from '../../activity-log/activity-log.service';
import { UberDirectClient } from './uber-direct.client';

export interface UberDirectCredentials {
  clientId: string;
  clientSecret: string;
  customerId: string;
  signingKey: string;
}

export interface UberDirectAccount {
  client: UberDirectClient;
  signingKey: string;
}

/**
 * Each restaurant brings its own Uber Direct account, so Uber bills the restaurant and not the platform.
 * The client secret and the webhook signing key are saved encrypted and are never returned.
 */
@Injectable()
export class UberDirectAccountService {
  private readonly clients = new Map<string, UberDirectClient>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly activityLog: ActivityLogService,
  ) {}

  private urls() {
    return {
      apiUrl: this.config.get<string>('UBER_DIRECT_API_URL') ?? 'https://api.uber.com',
      authUrl: this.config.get<string>('UBER_DIRECT_AUTH_URL') ?? 'https://auth.uber.com',
    };
  }

  /** The restaurant's Uber client (it keeps its own login token) and webhook signing key, or null when it has no Uber account. */
  async forRestaurant(restaurantId: string): Promise<UberDirectAccount | null> {
    const row = await this.prisma.restaurantUberDirect.findUnique({ where: { restaurantId } });
    if (!row) return null;

    // The client keeps its login token, so it is reused until save() or remove() drops it.
    let client = this.clients.get(restaurantId);
    if (!client) {
      client = new UberDirectClient(() => ({ clientId: row.clientId, clientSecret: decryptSecret(row.clientSecret), customerId: row.customerId, ...this.urls() }));
      this.clients.set(restaurantId, client);
    }
    return { client, signingKey: decryptSecret(row.signingKey) };
  }

  private async assertRestaurant(tenantId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId }, select: { id: true } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
  }

  /** What the settings page shows. Never includes the secrets. */
  async status(tenantId: string, restaurantId: string) {
    await this.assertRestaurant(tenantId, restaurantId);
    const row = await this.prisma.restaurantUberDirect.findUnique({ where: { restaurantId }, select: { clientId: true, customerId: true } });
    const webhookPath = `/api/v1/delivery-webhooks/uber/${restaurantId}`;
    const base = this.config.get<string>('BACKEND_URL')?.replace(/\/+$/, '');
    return { connected: !!row, clientId: row?.clientId ?? null, customerId: row?.customerId ?? null, webhookPath, webhookUrl: base ? `${base}${webhookPath}` : null };
  }

  async save(tenantId: string, restaurantId: string, actorId: string, isOwner: boolean, credentials: UberDirectCredentials) {
    if (!isOwner) throw new ForbiddenException('Only the owner can change the Uber Direct account');
    await this.assertRestaurant(tenantId, restaurantId);

    // Check the login with Uber before saving, so a typo is caught now and not on the first order.
    try {
      await new UberDirectClient(() => ({ clientId: credentials.clientId, clientSecret: credentials.clientSecret, customerId: credentials.customerId, ...this.urls() })).verify();
    } catch (err) {
      const message = (err as Error).message ?? '';
      throw new BadRequestException(
        /\((400|401|403)\)/.test(message) ? 'Uber did not accept this client ID and secret. Check them in your Uber Direct dashboard.' : 'Could not reach Uber to check these details. Try again in a moment.',
      );
    }

    const data = {
      clientId: credentials.clientId,
      clientSecret: encryptSecret(credentials.clientSecret),
      customerId: credentials.customerId,
      signingKey: encryptSecret(credentials.signingKey),
    };
    await this.prisma.restaurantUberDirect.upsert({ where: { restaurantId }, create: { restaurantId, ...data }, update: data });
    this.clients.delete(restaurantId);
    await this.activityLog.log({ tenantId, restaurantId, actorType: 'OWNER', actorId, action: 'UBER_DIRECT_SAVED', description: 'The restaurant\'s Uber Direct account was saved' });
    return this.status(tenantId, restaurantId);
  }

  // shortcut: removing mid-delivery leaves that courier's updates refused (the order can still be finished by hand), block it if that bites
  async remove(tenantId: string, restaurantId: string, actorId: string, isOwner: boolean) {
    if (!isOwner) throw new ForbiddenException('Only the owner can remove the Uber Direct account');
    await this.assertRestaurant(tenantId, restaurantId);
    if (!(await this.prisma.restaurantUberDirect.findUnique({ where: { restaurantId }, select: { id: true } }))) {
      throw new BadRequestException('No Uber Direct account is saved for this restaurant');
    }

    await this.prisma.restaurantUberDirect.delete({ where: { restaurantId } });
    this.clients.delete(restaurantId);
    await this.activityLog.log({ tenantId, restaurantId, actorType: 'OWNER', actorId, action: 'UBER_DIRECT_REMOVED', description: 'The restaurant\'s Uber Direct account was removed' });
    return this.status(tenantId, restaurantId);
  }
}
