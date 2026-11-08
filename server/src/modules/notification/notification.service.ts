import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildOrderConfirmationEmail } from './templates/order-confirmation.email';
import { describeRefundPayback } from '../../common/utils/refund-method.util';
import { MailSender, smtpSenderFromEnv } from './mail.transport';
import { buildOrderUpdateEmail, OrderUpdateKind } from './templates/order-update.email';
import { buildNewOrderOwnerEmail } from './templates/new-order-owner.email';

/** Order status (or the rider's PICKED_UP step) -> the email the customer gets. */
const UPDATE_KIND: Record<string, OrderUpdateKind> = {
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'DELIVERED',
};

/**
 * NotificationService
 * ---------------------
 * Order status change, coupon offer, आदि बारे customer/owner लाई सूचना पठाउने।
 * Email SMTP बाट जान्छ (SMTP_HOST सेट भएको बेला); SMTP नभए, र SMS/push का लागि,
 * यसले DB मा record गर्छ र console मा print मात्र गर्छ — SMS provider अझै जोडिएको छैन।
 */
@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  /** Null when SMTP is not configured: emails are then only logged. Tests replace this with a fake. */
  mailer: MailSender | null = smtpSenderFromEnv();

  constructor(private readonly prisma: PrismaService) {}

  /** Reports bad SMTP settings at startup instead of when the first email silently fails. Never blocks boot. */
  onModuleInit() {
    if (!this.mailer) {
      if (process.env.NODE_ENV === 'production') this.logger.warn('SMTP_HOST is not set: emails are only logged, not delivered.');
      return;
    }
    this.mailer
      .verify?.()
      .then(() => this.logger.log(`SMTP ready (${process.env.SMTP_HOST}): emails will be delivered.`))
      .catch((error: Error) => this.logger.error(`SMTP connection FAILED (${process.env.SMTP_HOST}): ${error.message}. Emails will not be delivered.`));
  }

  async send(params: {
    tenantId?: string;
    customerId?: string;
    channel: 'EMAIL' | 'SMS' | 'PUSH';
    recipient: string;
    subject?: string;
    body: string;
    html?: string;
    /** Saved and logged instead of `body`, for messages that carry a secret such as a sign-in code. */
    storedBody?: string;
  }) {
    const recordedBody = params.storedBody ?? params.body;
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        customerId: params.customerId,
        channel: params.channel,
        recipient: params.recipient,
        subject: params.subject,
        body: recordedBody,
        status: 'PENDING',
      },
    });

    try {
      if (params.channel === 'EMAIL' && this.mailer) {
        await this.mailer.send({ to: params.recipient, subject: params.subject ?? '(no subject)', text: params.body, html: params.html });
      } else {
        this.logger.log(`[${params.channel}] to ${params.recipient}: ${recordedBody}`);
      }

      return await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Notification failed for ${params.recipient}`, error as Error);
      return this.prisma.notification.update({ where: { id: notification.id }, data: { status: 'FAILED' } });
    }
  }

  /** Customer-facing order summary (HTML + text), built from the order as it is now. */
  async buildOrderConfirmation(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: { select: { name: true, currencyCode: true } },
        customer: { select: { name: true, email: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });
    if (!order) return null;

    const email = buildOrderConfirmationEmail({
      brandName: process.env.BRAND_NAME ?? 'LogicBit',
      supportEmail: process.env.SUPPORT_EMAIL || undefined,
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      orderType: order.orderType,
      restaurantName: order.restaurant.name,
      currencyCode: order.restaurant.currencyCode,
      deliveryAddress: order.deliveryAddress,
      phone: order.customer.phone,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items.map((i) => ({ name: i.menuItem.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.subtotal, notes: i.notes })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      discountAmount: order.discountAmount,
      couponCode: order.couponCode,
      total: order.total,
    });

    return { email, recipient: order.customer.email, customerId: order.customerId, tenantId: order.tenantId };
  }

  /** Sent once, when the restaurant accepts the order. */
  async notifyOrderAccepted(orderId: string) {
    const built = await this.buildOrderConfirmation(orderId);
    if (!built) return;

    return this.send({
      tenantId: built.tenantId,
      customerId: built.customerId,
      channel: 'EMAIL',
      recipient: built.recipient,
      subject: built.email.subject,
      body: built.email.text,
      html: built.email.html,
    });
  }

  /** Emails everyone on the restaurant's account when an order reaches them. */
  async notifyNewOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: { select: { name: true, currencyCode: true } },
        customer: { select: { name: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
    });
    if (!order) return;

    const owners = await this.prisma.user.findMany({ where: { tenantId: order.tenantId, isActive: true }, select: { email: true } });
    const frontend = process.env.FRONTEND_URL?.split(',')[0]?.trim().replace(/\/$/, '');
    const email = buildNewOrderOwnerEmail({
      brandName: process.env.BRAND_NAME ?? 'LogicBit',
      restaurantName: order.restaurant.name,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      currencyCode: order.restaurant.currencyCode,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items.map((i) => ({ name: i.menuItem.name, quantity: i.quantity, total: i.subtotal, notes: i.notes })),
      total: order.total,
      dashboardUrl: frontend ? `${frontend}/owner/orders` : undefined,
    });

    for (const owner of owners) {
      await this.send({ tenantId: order.tenantId, channel: 'EMAIL', recipient: owner.email, subject: email.subject, body: email.text, html: email.html });
    }
  }

  async notifyRefundIssued(customerId: string, tenantId: string, orderNumber: string, amount: number, reason: string, method?: string | null, reference?: string | null) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return;

    return this.send({
      tenantId,
      customerId,
      channel: 'EMAIL',
      recipient: customer.email,
      subject: `Refund for order ${orderNumber}`,
      body: `The restaurant refunded ${amount.toFixed(2)}${describeRefundPayback(method, reference)} for your order ${orderNumber}. Reason: ${reason}`,
    });
  }

  /**
   * Tells the customer their order is on its way, or done. `PICKED_UP` is the rider collecting it,
   * which does not change the order status, so callers pass it explicitly. Other statuses send nothing.
   */
  async notifyOrderUpdate(orderId: string, event: string) {
    const kind = UPDATE_KIND[event];
    if (!kind) return;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: { select: { name: true } },
        customer: { select: { name: true, email: true } },
        delivery: { select: { driverName: true, driverPhone: true, driverVehicle: true, trackingUrl: true } },
      },
    });
    if (!order) return;

    const frontend = process.env.FRONTEND_URL?.split(',')[0]?.trim().replace(/\/$/, '');
    const email = buildOrderUpdateEmail({
      kind,
      brandName: process.env.BRAND_NAME ?? 'LogicBit',
      supportEmail: process.env.SUPPORT_EMAIL || undefined,
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      restaurantName: order.restaurant.name,
      orderUrl: frontend ? `${frontend}/en/orders/${order.id}` : undefined,
      driver: order.delivery
        ? { name: order.delivery.driverName, phone: order.delivery.driverPhone, vehicle: order.delivery.driverVehicle, trackingUrl: order.delivery.trackingUrl }
        : undefined,
    });

    return this.send({
      tenantId: order.tenantId,
      customerId: order.customerId,
      channel: 'EMAIL',
      recipient: order.customer.email,
      subject: email.subject,
      body: email.text,
      html: email.html,
    });
  }
}
