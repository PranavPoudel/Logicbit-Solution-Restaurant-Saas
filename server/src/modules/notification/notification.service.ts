import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * NotificationService
 * ---------------------
 * Order status change, coupon offer, आदि बारे customer/owner लाई सूचना
 * पठाउने। अहिले यसले DB मा log गर्छ र console मा print गर्छ (development
 * को लागि पर्याप्त) — production मा जाँदा actual SMS (Twilio/Sparrow SMS)
 * र Email (SendGrid/SES) provider जोड्नुपर्छ।
 *
 * Payment module कै जस्तै adapter pattern — भविष्यमा real provider थप्दा
 * यही file भित्र `dispatch()` को actual implementation बदल्ने मात्र हो,
 * Order/Auth जस्ता अरू module ले जे यो service call गरिरहेका छन् त्यो
 * उस्तै रहन्छ।
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(params: {
    tenantId?: string;
    customerId?: string;
    channel: 'EMAIL' | 'SMS' | 'PUSH';
    recipient: string;
    subject?: string;
    body: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        customerId: params.customerId,
        channel: params.channel,
        recipient: params.recipient,
        subject: params.subject,
        body: params.body,
        status: 'PENDING',
      },
    });

    try {
      // TODO(production): यहाँ real SMS/Email provider को API call गर्ने।
      // उदाहरण (SendGrid): await sendgrid.send({ to: params.recipient, subject: params.subject, text: params.body });
      this.logger.log(`[${params.channel}] to ${params.recipient}: ${params.body}`);

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Notification failed for ${params.recipient}`, error as Error);
      await this.prisma.notification.update({ where: { id: notification.id }, data: { status: 'FAILED' } });
    }

    return notification;
  }

  /** Order status बदलिँदा customer लाई सूचना पठाउने shortcut */
  async notifyOrderStatusChange(customerId: string, tenantId: string, orderNumber: string, status: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return;

    return this.send({
      tenantId,
      customerId,
      channel: 'EMAIL',
      recipient: customer.email,
      subject: `Order ${orderNumber} update`,
      body: `Your order ${orderNumber} is now ${status}.`,
    });
  }
}
