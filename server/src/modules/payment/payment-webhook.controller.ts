import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Req } from '@nestjs/common';
import { Request } from 'express'; // Ensure express types are available
import { OrderService } from '../order/order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';
import { PayPayUtil } from '../../common/utils/paypay.util';

@Controller('api/v1/payments/webhooks')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('paypay')
  @HttpCode(HttpStatus.OK)
  async handlePayPayWebhook(@Req() req: Request, @Body() payload: any) {
    this.logger.log(`Received PayPay webhook`);

    if (payload.notification_type !== 'Transaction') {
      return { status: 'ignored' };
    }

    const orderId = payload.merchant_order_id;
    const state = payload.state;

    if (!orderId) {
      this.logger.error('Missing merchant_order_id in webhook payload');
      return { status: 'error', message: 'Missing merchant_order_id' };
    }

    // 1. Fetch order to verify multi-tenant scope and current status
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, tenantId: true, restaurantId: true, paymentStatus: true, paymentMethod: true },
    });

    if (!order) {
      this.logger.warn(`Order ${orderId} not found`);
      return { status: 'ignored', message: 'Order not found' }; // 200 OK to stop PayPay retries
    }

    if (order.paymentMethod !== PaymentMethod.PAYPAY) {
      return { status: 'ignored', message: 'Not a PayPay order' };
    }

    if (order.paymentStatus === 'PAID') {
      return { status: 'success', message: 'Already paid' };
    }

    // 2. CRITICAL SECURITY FIX: Fetch restaurant to get the specific secret for this order
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: order.restaurantId },
      select: { paypayApiSecret: true },
    });

    if (!restaurant || !restaurant.paypayApiSecret) {
      this.logger.error(`Restaurant ${order.restaurantId} missing PayPay secret`);
      return { status: 'error', message: 'Restaurant configuration missing' };
    }

    // 3. Verify Cryptographic Signature
    // NOTE: Ensure your NestJS main.ts has: 
    // app.use(express.json({ verify: (req: any, res, buf) => { req.rawBody = buf.toString(); } }));
    const rawBody = (req as any).rawBody || JSON.stringify(payload);
    const url = req.originalUrl || '/api/v1/payments/webhooks/paypay';
    const method = req.method;

    const isValidSignature = PayPayUtil.verifyWebhookSignature(
      restaurant.paypayApiSecret,
      req.headers,
      rawBody,
      url,
      method,
    );

    if (!isValidSignature) {
      this.logger.warn(`Invalid webhook signature for order ${orderId}`);
      return { status: 'error', message: 'Invalid signature' };
    }

    // 4. Process COMPLETED state only after cryptographic verification
    if (state === 'COMPLETED') {
      await this.orderService.markOrderAsPaid(orderId);
      this.logger.log(`Order ${orderId} successfully marked as PAID`);
      return { status: 'success', message: 'Order marked as paid' };
    }

    this.logger.log(`Order ${orderId} state changed to ${state}. No action required.`);
    return { status: 'ignored', message: `State ${state} not requiring action` };
  }
}