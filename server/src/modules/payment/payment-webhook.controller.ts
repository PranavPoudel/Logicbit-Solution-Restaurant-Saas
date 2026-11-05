import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';

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

    const paid = await this.orderService.confirmPayPayPayment(orderId);
    return paid ? { status: 'success', message: 'Order is paid' } : { status: 'ignored', message: 'Payment not confirmed' };
  }
}
