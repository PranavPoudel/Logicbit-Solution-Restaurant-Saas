import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';

/** Stripe events that mean "a Checkout payment may have finished". Anything else is ignored. */
const STRIPE_PAYMENT_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];

@Controller('api/v1/payments/webhooks')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(private readonly orderService: OrderService) {}

  /**
   * The webhook is only a nudge: nothing in its body is trusted. The order is marked paid
   * only after PayPay itself confirms the payment, so a forged webhook can never mark anything paid.
   */
  @Post('paypay')
  @HttpCode(HttpStatus.OK)
  async handlePayPayWebhook(@Body() payload: any) {
    if (payload?.notification_type !== 'Transaction') return { status: 'ignored' };

    const orderId = payload.merchant_order_id;
    if (typeof orderId !== 'string' || !orderId) {
      this.logger.error('Missing merchant_order_id in webhook payload');
      return { status: 'error', message: 'Missing merchant_order_id' };
    }

    const paid = await this.orderService.confirmOnlinePayment(orderId);
    return paid ? { status: 'success', message: 'Order is paid' } : { status: 'ignored', message: 'Payment not confirmed' };
  }

  /**
   * Same rule as PayPay: the body only says which order to look at. The order is marked paid only after
   * Stripe itself says that order's Checkout Session is paid for the full total, so a forged event changes nothing.
   * (Each restaurant has its own Stripe account, so there is no single signing secret to verify against.)
   */
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(@Body() payload: any) {
    if (!STRIPE_PAYMENT_EVENTS.includes(payload?.type)) return { status: 'ignored' };

    const session = payload?.data?.object;
    const orderId = session?.client_reference_id ?? session?.metadata?.orderId;
    if (typeof orderId !== 'string' || !orderId) {
      this.logger.error('Missing order id in Stripe webhook payload');
      return { status: 'error', message: 'Missing order id' };
    }

    const paid = await this.orderService.confirmOnlinePayment(orderId);
    return paid ? { status: 'success', message: 'Order is paid' } : { status: 'ignored', message: 'Payment not confirmed' };
  }
}
