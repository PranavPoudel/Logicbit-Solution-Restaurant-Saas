import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client'; // ✅ Import Prisma enum

@Controller('api/v1/payments/webhooks')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('paypay')
  @HttpCode(HttpStatus.OK)
  async handlePayPayWebhook(@Body() payload: any) {
    this.logger.log(`Received PayPay webhook: ${JSON.stringify(payload)}`);

    // 1. Basic payload validation
    if (payload.notification_type !== 'Transaction') {
      this.logger.warn('Ignored non-Transaction webhook');
      return { status: 'ignored' };
    }

    const orderId = payload.merchant_order_id; // We set this to our Order ID
    const state = payload.state; // 'COMPLETED', 'CANCELED', 'EXPIRED', 'FAILED'

    if (!orderId) {
      this.logger.error('Missing merchant_order_id in webhook payload');
      return { status: 'error', message: 'Missing merchant_order_id' };
    }

    // 2. Fetch order to verify multi-tenant scope and current status
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, tenantId: true, restaurantId: true, paymentStatus: true, paymentMethod: true },
    });

    if (!order) {
      this.logger.warn(`Order ${orderId} not found in database`);
      return { status: 'ignored', message: 'Order not found' }; // Return 200 to prevent PayPay from retrying endlessly
    }

    // ✅ FIX: Use Prisma enum for type-safe comparison
    if (order.paymentMethod !== PaymentMethod.PAYPAY) {
      this.logger.warn(`Order ${orderId} is not a PayPay order`);
      return { status: 'ignored', message: 'Not a PayPay order' };
    }

    if (order.paymentStatus === 'PAID') {
      this.logger.log(`Order ${orderId} is already marked as PAID (Idempotency)`);
      return { status: 'success', message: 'Already paid' };
    }

    // 3. Process COMPLETED state
    if (state === 'COMPLETED') {
      await this.orderService.markOrderAsPaid(orderId);
      this.logger.log(`Order ${orderId} successfully marked as PAID`);
      return { status: 'success', message: 'Order marked as paid' };
    }

    // 4. Handle other states (CANCELED, EXPIRED, FAILED)
    this.logger.log(`Order ${orderId} state changed to ${state}. No action required.`);
    return { status: 'ignored', message: `State ${state} not requiring action` };
  }
}