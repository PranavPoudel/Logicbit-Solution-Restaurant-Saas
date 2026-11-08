//src/modules/restaurant/restaurant.service.ts
import { Prisma } from '@prisma/client';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { isValidTimeZone } from '../../common/utils/opening-hours.util';
import { encryptSecret } from '../../common/utils/secret-box.util';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { PAYMENT_PAGE_GONE_MINUTES } from '../order/order.service';
import { withoutPaymentSecrets } from '../../common/utils/restaurant-secrets.util';

@Injectable()
export class RestaurantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll(tenantId: string) {
    const restaurants = await this.prisma.restaurant.findMany({ where: { tenantId } });
    
    return restaurants.map(withoutPaymentSecrets);
  }

  async findOne(tenantId: string, id: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    
    return withoutPaymentSecrets(restaurant);
  }

  async create(tenantId: string, dto: CreateRestaurantDto) {
    const restaurant = await this.prisma.restaurant.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        city: dto.city,
        isOpen: dto.isOpen ?? true,
        supportsDelivery: dto.supportsDelivery ?? true,
        supportsPickup: dto.supportsPickup ?? true,
        supportsDineIn: dto.supportsDineIn ?? false,
        selfDeliveryRadiusKm: 5,
        maxDeliveryRadiusKm: 10,
        platformCommissionPercent: 10,
        primaryColor: '#E3A008',
        secondaryColor: '#17181C',
      },
    });

    return withoutPaymentSecrets(restaurant);
  }

  /**
   * Disconnects Stripe: deletes LogicBit's copy of the restaurant's key and switches card payments off.
   * Refused while customers are in the middle of paying by card: without the key a payment that lands could not be confirmed.
   */
  async removeStripeKey(tenantId: string, id: string, actorId: string, isOwner: boolean) {
    if (!isOwner) throw new ForbiddenException('Only the owner can remove the payment key');
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id, tenantId }, select: { id: true, stripeSecretKey: true } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (!restaurant.stripeSecretKey) throw new BadRequestException('No Stripe key is saved for this restaurant');

    const since = new Date(Date.now() - PAYMENT_PAGE_GONE_MINUTES * 60000);
    const waiting = await this.prisma.order.count({
      where: { restaurantId: id, paymentMethod: 'CREDIT_CARD', paymentStatus: 'UNPAID', status: 'PENDING', createdAt: { gte: since } },
    });
    if (waiting > 0) {
      throw new ConflictException(
        `${waiting} customer${waiting === 1 ? ' is' : 's are'} still paying by card. Remove the key once those payments finish, which takes at most about ${PAYMENT_PAGE_GONE_MINUTES} minutes.`,
      );
    }

    await this.prisma.restaurant.updateMany({ where: { id, tenantId }, data: { stripeSecretKey: null, supportsCreditCard: false } });
    await this.activityLog.log({
      tenantId,
      restaurantId: id,
      actorType: 'OWNER',
      actorId,
      action: 'STRIPE_KEY_REMOVED',
      description: 'The Stripe key was removed and card payments were switched off',
    });
    return this.findOne(tenantId, id);
  }

  /**
   * Payment credentials decide where customers' money goes, so only the owner may change them. The settings page
   * re-sends the PayPay merchant id and API key on every save, so those only count when the value really differs.
   */
  private assertMayChangePaymentKeys(dto: UpdateRestaurantDto, current: { paypayMerchantId?: string | null; paypayApiKey?: string | null }) {
    const changes =
      !!dto.stripeSecretKey ||
      !!dto.paypayApiSecret ||
      (dto.paypayMerchantId !== undefined && dto.paypayMerchantId !== (current.paypayMerchantId ?? '')) ||
      (dto.paypayApiKey !== undefined && dto.paypayApiKey !== (current.paypayApiKey ?? ''));
    if (changes) throw new ForbiddenException('Only the owner can change payment keys');
  }

  async update(tenantId: string, id: string, dto: UpdateRestaurantDto, isOwner: boolean) {
    const current = await this.findOne(tenantId, id);
    if (!isOwner) this.assertMayChangePaymentKeys(dto, current as { paypayMerchantId?: string | null; paypayApiKey?: string | null });

    if (dto.timezone && !isValidTimeZone(dto.timezone)) throw new BadRequestException('Unknown timezone');
    
    const { openingHours, ...rest } = dto;
    await this.prisma.restaurant.updateMany({ 
      where: { id, tenantId }, 
      data: {
        ...rest,
        // Payment keys are saved encrypted, never as plain text.
        ...(rest.stripeSecretKey && { stripeSecretKey: encryptSecret(rest.stripeSecretKey) }),
        ...(rest.paypayApiSecret && { paypayApiSecret: encryptSecret(rest.paypayApiSecret) }),
        ...(openingHours && { openingHours: openingHours as unknown as Prisma.InputJsonValue }),
      },
    });
    
    return this.findOne(tenantId, id);
  }
}