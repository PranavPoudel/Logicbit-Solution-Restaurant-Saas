import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CheckoutResult, SubscriptionPaymentProvider } from './subscription-payment-provider.interface';
import { CardSubscriptionProvider, PayPaySubscriptionProvider } from './providers/future-subscription-providers.stub';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class SubscriptionPaymentService {
  private readonly logger = new Logger(SubscriptionPaymentService.name);
  private readonly providers: Record<string, SubscriptionPaymentProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionService,
    paypay: PayPaySubscriptionProvider,
    card: CardSubscriptionProvider,
  ) {
    this.providers = { PAYPAY: paypay, CARD: card };
  }

  private getProvider(method: string) {
    const provider = this.providers[method.toUpperCase()];
    if (!provider) throw new BadRequestException(`Unknown payment method: ${method}`);
    return provider;
  }

  async createCheckout(tenantId: string, restaurantId: string, dto: CheckoutDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, tenantId },
      select: { id: true, currencyCode: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const plan = await this.prisma.subscriptionPlan.findFirst({ where: { id: dto.planId, isActive: true } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (plan.price <= 0) throw new BadRequestException('This plan is free and does not need a payment');

    const provider = this.getProvider(dto.method);
    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        tenantId,
        restaurantId,
        planId: plan.id,
        method: dto.method,
        amount: plan.price,
        currencyCode: restaurant.currencyCode,
      },
    });

    let checkout: CheckoutResult;
    try {
      checkout = await provider.createCheckout({
        paymentId: payment.id,
        amount: plan.price,
        currencyCode: restaurant.currencyCode,
        planName: plan.name,
      });
    } catch (err) {
      await this.prisma.subscriptionPayment.delete({ where: { id: payment.id } });
      throw err;
    }

    await this.prisma.subscriptionPayment.update({ where: { id: payment.id }, data: { providerReference: checkout.providerReference } });
    return { paymentId: payment.id, redirectUrl: checkout.redirectUrl };
  }

  async handleWebhook(method: string, payload: any, signature?: string) {
    const provider = this.getProvider(method);
    const { paymentId, success } = await provider.verifyWebhook(payload, signature);

    const payment = await this.prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.method !== provider.methodName) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PENDING') return { status: 'already_processed' };

    const claimed = await this.prisma.subscriptionPayment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: success ? { status: 'PAID', paidAt: new Date() } : { status: 'FAILED' },
    });
    if (claimed.count === 0) return { status: 'already_processed' };

    if (success) {
      await this.subscriptions.renewSubscription(payment.restaurantId, { planId: payment.planId }, `payment:${payment.id}`);
      this.logger.log(`Subscription paid and renewed: restaurant ${payment.restaurantId}, payment ${payment.id}`);
    }
    return { status: success ? 'paid' : 'failed' };
  }

  plans() {
    return this.subscriptions.findAllPlans();
  }

  async history(tenantId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId }, select: { id: true } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.subscriptionPayment.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
