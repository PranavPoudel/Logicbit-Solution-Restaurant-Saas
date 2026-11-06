import { Injectable, BadRequestException, BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// The stripe package is CommonJS (module.exports = Stripe), and this project has no esModuleInterop, so a default import would be undefined at runtime.
import Stripe = require('stripe');
import { PaymentProvider, PaymentInitiationResult, PaymentContext, PaymentCheck, PaymentResume, RefundResult } from '../payment-provider.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { fromStripeAmount, isStripeCurrencySupported, toStripeAmount } from '../../../common/utils/stripe-amount.util';
import { decryptSecret } from '../../../common/utils/secret-box.util';

/** A Checkout Session stays open this long (Stripe's minimum is 30 minutes), so an abandoned order cannot be paid days later. */
const SESSION_MINUTES = 31;

/**
 * Card payments (Visa, Mastercard, American Express, JCB and more) through Stripe Checkout.
 * The customer types the card on Stripe's own page, so card numbers never reach this server.
 * Each restaurant uses its own Stripe account, through the secret key saved in its settings.
 */
@Injectable()
export class StripeProvider implements PaymentProvider {
  // Kept as CREDIT_CARD so the order DTO, the enum and the checkout screen need no new payment method.
  readonly methodName = 'CREDIT_CARD';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(StripeProvider.name);
  private warnedIgnoredOverride = false;

  /** The only place a Stripe client is built, so tests can swap in a fake. */
  protected client(secretKey: string): Stripe {
    // STRIPE_API_URL points the client at a local fake Stripe for testing; leave it unset to talk to the real Stripe.
    // It is ignored in production: every restaurant's secret key travels with each call, so a stray value there
    // would send those keys to another host.
    const override = this.configService.get<string>('STRIPE_API_URL');
    if (override && process.env.NODE_ENV === 'production') {
      if (!this.warnedIgnoredOverride) {
        this.warnedIgnoredOverride = true;
        this.logger.warn('STRIPE_API_URL is set but ignored in production. Remove it from the environment.');
      }
    }
    const target = override && process.env.NODE_ENV !== 'production' ? new URL(override) : null;
    return new Stripe(decryptSecret(secretKey), {
      maxNetworkRetries: 1,
      timeout: 15000,
      ...(target && { host: target.hostname, port: target.port || (target.protocol === 'https:' ? '443' : '80'), protocol: target.protocol.replace(':', '') as 'http' | 'https' }),
    });
  }

  async initiate(orderId: string, amount: number, currencyCode: string, context?: PaymentContext): Promise<PaymentInitiationResult> {
    if (!context) throw new BadRequestException('Order details are missing');
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: context.restaurantId } });
    if (!restaurant) throw new BadRequestException('Restaurant not found');
    if (!restaurant.stripeSecretKey) throw new BadRequestException('Card payment is not configured for this restaurant.');
    if (!isStripeCurrencySupported(currencyCode)) throw new BadRequestException(`Card payments in ${currencyCode} are not supported.`);

    try {
      const session = await this.createSession(restaurant.stripeSecretKey, restaurant.name, { orderId, orderNumber: context.orderNumber, amount, currencyCode }, `checkout-${orderId}`);
      return { success: true, paymentStatus: 'UNPAID', redirectUrl: session.url, providerReference: session.id };
    } catch (error) {
      throw new BadGatewayException(`Stripe could not start the payment: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private async createSession(
    secretKey: string,
    restaurantName: string,
    order: { orderId: string; orderNumber: string; amount: number; currencyCode: string },
    idempotencyKey: string,
  ) {
    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').split(',')[0].trim().replace(/\/$/, '');
    const returnUrl = `${frontendUrl}/payment/callback?orderId=${order.orderId}&provider=stripe`;

    const session = await this.client(secretKey).checkout.sessions.create(
      {
        mode: 'payment',
        // The customer is charged, and refunded, in the order's currency. Stripe's automatic conversion to the
        // customer's own currency would make the charge differ from the order total and break refund amounts.
        adaptive_pricing: { enabled: false },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: order.currencyCode.toLowerCase(),
              unit_amount: toStripeAmount(order.amount, order.currencyCode),
              product_data: { name: `Order ${order.orderNumber} - ${restaurantName}` },
            },
          },
        ],
        client_reference_id: order.orderId,
        metadata: { orderId: order.orderId },
        payment_intent_data: { metadata: { orderId: order.orderId } },
        expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
        success_url: returnUrl,
        cancel_url: `${returnUrl}&cancelled=1`,
      },
      { idempotencyKey },
    );
    if (!session.url) throw new Error('Stripe did not return a payment page');
    return { id: session.id, url: session.url };
  }

  /**
   * The customer wants to pay an order that is still unpaid. The open payment page is reused, so there is never a
   * second live page for the same order; only when it has expired is a fresh one made. The fresh page's key is built from
   * the expired page's id, so two clicks at once get the same new page.
   */
  async resume(orderId: string): Promise<PaymentResume> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    if (!order?.paymentReference) throw new BadRequestException('This order has no card payment to continue.');
    if (!order.restaurant.stripeSecretKey) throw new BadRequestException('Card payment is not configured for this restaurant.');

    try {
      const known = await this.client(order.restaurant.stripeSecretKey).checkout.sessions.retrieve(order.paymentReference);
      if (known.client_reference_id !== orderId) throw new Error('That payment page belongs to another order');
      if (known.payment_status === 'paid') return { paid: true };
      if (known.status === 'open' && known.url) return { redirectUrl: known.url, providerReference: known.id };

      const fresh = await this.createSession(
        order.restaurant.stripeSecretKey,
        order.restaurant.name,
        { orderId, orderNumber: order.orderNumber, amount: order.total, currencyCode: order.currencyCode ?? order.restaurant.currencyCode },
        `checkout-${orderId}-after-${known.id}`,
      );
      return { redirectUrl: fresh.url, providerReference: fresh.id };
    } catch (error) {
      throw new BadGatewayException(`Stripe could not reopen the payment: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  async cancelPayment(orderId: string): Promise<{ paid: boolean }> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    if (!order?.paymentReference) return { paid: false }; // no payment page was ever opened
    // Without the key we cannot see or close the page, and a customer could still pay it. Never guess "not paid".
    if (!order.restaurant.stripeSecretKey) {
      throw new BadGatewayException('Card payments are not set up for this restaurant right now, so the payment page cannot be closed.');
    }

    const stripe = this.client(order.restaurant.stripeSecretKey);
    try {
      const session = await stripe.checkout.sessions.retrieve(order.paymentReference);
      if (session.client_reference_id !== orderId) return { paid: false };
      if (session.payment_status === 'paid') return { paid: true };
      if (session.status === 'open') await stripe.checkout.sessions.expire(session.id);
      return { paid: false };
    } catch (error) {
      // The page may have been paid in the moment between the check and the close.
      try {
        const again = await stripe.checkout.sessions.retrieve(order.paymentReference);
        if (again.payment_status === 'paid') return { paid: true };
        if (again.status !== 'open') return { paid: false };
      } catch {
        // fall through: we cannot tell
      }
      throw new BadGatewayException(`Stripe could not close the payment page: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  /**
   * Asks Stripe itself whether the order was paid. A webhook only says "check this order": the answer
   * (status, amount, currency) always comes from Stripe, so a forged webhook can never mark anything paid.
   */
  async checkPayment(orderId: string): Promise<PaymentCheck> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    if (!order?.paymentReference || !order.restaurant.stripeSecretKey) return { paid: false };
    try {
      const session = await this.client(order.restaurant.stripeSecretKey).checkout.sessions.retrieve(order.paymentReference);
      // The session must belong to this order, whatever reference is stored.
      if (session.client_reference_id !== orderId) return { paid: false };
      const currency = session.currency?.toUpperCase();
      return {
        paid: session.payment_status === 'paid',
        currency,
        amount: currency && session.amount_total != null ? fromStripeAmount(session.amount_total, currency) : undefined,
      };
    } catch {
      return { paid: false };
    }
  }

  async refund(orderId: string, amount: number, existingRefundId?: string): Promise<RefundResult> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    if (!order) return { status: 'FAILED', message: 'Order not found' };
    if (!order.restaurant.stripeSecretKey || !order.paymentReference) return { status: 'FAILED', message: 'Card payment is not configured for this restaurant.' };
    const state = (status?: string | null): RefundResult['status'] => (status === 'succeeded' ? 'COMPLETED' : status === 'failed' || status === 'canceled' ? 'FAILED' : 'PENDING');

    try {
      const stripe = this.client(order.restaurant.stripeSecretKey);

      // A refund Stripe already accepted is checked, not sent twice.
      if (existingRefundId) {
        const known = await stripe.refunds.retrieve(existingRefundId);
        if (known.status !== 'failed' && known.status !== 'canceled') {
          return { status: state(known.status), providerReference: known.id };
        }
      }

      const session = await stripe.checkout.sessions.retrieve(order.paymentReference);
      if (session.client_reference_id !== orderId || session.payment_status !== 'paid') {
        return { status: 'FAILED', message: 'Stripe shows this payment as not completed' };
      }
      const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      if (!paymentIntent) return { status: 'FAILED', message: 'Stripe has no card payment for this order' };

      const minor = toStripeAmount(amount, order.currencyCode ?? order.restaurant.currencyCode);
      // One-minute window: a double click cannot refund twice, but a retry after a failure is a new request.
      const sent = await stripe.refunds.create(
        { payment_intent: paymentIntent, amount: minor, metadata: { orderId } },
        { idempotencyKey: `refund-${orderId}-${minor}-${Math.floor(Date.now() / 60000)}` },
      );
      return {
        status: state(sent.status),
        providerReference: sent.id,
        message: sent.status === 'failed' ? sent.failure_reason ?? 'Stripe could not refund this payment' : undefined,
      };
    } catch (error) {
      return { status: 'FAILED', message: error instanceof Error ? error.message : 'Could not reach Stripe' };
    }
  }
}
