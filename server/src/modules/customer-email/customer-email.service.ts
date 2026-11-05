import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SendCustomerEmailDto } from './dto/send-customer-email.dto';
import { readUnsubscribeToken, unsubscribeUrl } from './unsubscribe-token';

const MAX_EMAILS_PER_DAY = 20;
const MAX_BROADCASTS_PER_DAY = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const QUEUE_TICK_MS = 5000;
const QUEUE_BATCH = 10;
const MAX_ATTEMPTS = 3;

export function emailFooter(restaurantName: string, url: string) {
  return `You're getting this because you've ordered from ${restaurantName}.\nUnsubscribe: ${url}`;
}

export function deliveryState(email: { recipientCount: number; sentCount: number; failedCount: number }) {
  return email.sentCount + email.failedCount >= email.recipientCount ? 'DONE' : 'SENDING';
}

@Injectable()
export class CustomerEmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CustomerEmailService.name);
  private timer?: NodeJS.Timeout;
  private working = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async onModuleInit() {
    // Rows left mid-send by a restart go back in the line. Assumes one API instance.
    await this.prisma.customerEmailRecipient
      .updateMany({ where: { status: 'SENDING' }, data: { status: 'PENDING' } })
      .catch((err) => this.logger.error('Could not reset unfinished emails', err as Error));
    this.timer = setInterval(() => void this.processQueue(), QUEUE_TICK_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async assertRestaurant(tenantId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId }, select: { id: true, name: true } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async customers(tenantId: string, restaurantId: string, q?: string) {
    await this.assertRestaurant(tenantId, restaurantId);

    const counts = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { tenantId, restaurantId },
      _count: { _all: true },
    });
    if (!counts.length) return [];

    const term = q?.trim();
    const [customers, unsubscribed] = await Promise.all([
      this.prisma.customer.findMany({
        where: {
          id: { in: counts.map((c) => c.customerId) },
          isActive: true,
          ...(term && {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ],
          }),
        },
        select: { id: true, name: true, email: true },
      }),
      this.prisma.emailUnsubscribe.findMany({ where: { restaurantId }, select: { customerId: true } }),
    ]);

    const orderCount = new Map(counts.map((c) => [c.customerId, c._count._all]));
    const optedOut = new Set(unsubscribed.map((u) => u.customerId));
    return customers
      .map((c) => ({ ...c, orders: orderCount.get(c.id) ?? 0, unsubscribed: optedOut.has(c.id) }))
      .sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name));
  }

  async orders(tenantId: string, restaurantId: string, customerId: string) {
    await this.assertRestaurant(tenantId, restaurantId);

    const orders = await this.prisma.order.findMany({
      where: { tenantId, restaurantId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: { select: { quantity: true, menuItem: { select: { name: true } } } },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      number: o.orderNumber,
      customerId,
      items: o.items.map((i) => `${i.quantity} × ${i.menuItem.name}`).join(', '),
      total: o.total,
      status: o.status,
      placedAt: o.createdAt,
    }));
  }

  async recentOrders(tenantId: string, restaurantId: string) {
    await this.assertRestaurant(tenantId, restaurantId);

    const orders = await this.prisma.order.findMany({
      where: { tenantId, restaurantId, customer: { isActive: true } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        customer: { select: { id: true, name: true } },
        items: { select: { quantity: true, menuItem: { select: { name: true } } } },
      },
    });

    return orders.map((o) => ({
      id: o.id,
      number: o.orderNumber,
      customerId: o.customer.id,
      customerName: o.customer.name,
      items: o.items.map((i) => `${i.quantity} × ${i.menuItem.name}`).join(', '),
      total: o.total,
      status: o.status,
      placedAt: o.createdAt,
    }));
  }

  async history(tenantId: string, restaurantId: string) {
    await this.assertRestaurant(tenantId, restaurantId);

    const sent = await this.prisma.customerEmail.findMany({
      where: { tenantId, restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const customerIds = sent.flatMap((s) => (s.customerId ? [s.customerId] : []));
    const orderIds = sent.flatMap((s) => (s.orderId ? [s.orderId] : []));
    const [customers, orders] = await Promise.all([
      this.prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } }),
      this.prisma.order.findMany({ where: { id: { in: orderIds } }, select: { id: true, orderNumber: true } }),
    ]);
    const customerName = new Map(customers.map((c) => [c.id, c.name]));
    const orderNumber = new Map(orders.map((o) => [o.id, o.orderNumber]));

    return sent.map((s) => ({
      id: s.id,
      subject: s.subject,
      audience: s.audience,
      recipientLabel: s.audience === 'ALL' ? 'All customers' : (customerName.get(s.customerId ?? '') ?? 'Customer'),
      recipientCount: s.recipientCount,
      sentCount: s.sentCount,
      failedCount: s.failedCount,
      state: deliveryState(s),
      orderNumber: s.orderId ? orderNumber.get(s.orderId) : undefined,
      sentAt: s.createdAt,
    }));
  }

  async send(tenantId: string, restaurantId: string, dto: SendCustomerEmailDto) {
    const restaurant = await this.assertRestaurant(tenantId, restaurantId);
    await this.assertDailyLimit(restaurantId, dto.audience);

    const order = dto.orderId ? await this.findOrderForCustomer(tenantId, restaurantId, dto.customerId, dto.orderId) : null;
    // An email about the customer's own order is a service message; everything else honours unsubscribes.
    const promotional = dto.audience === 'ALL' || !order;
    const recipients = await this.resolveRecipients(tenantId, restaurantId, dto, promotional);
    if (!recipients.length) throw new BadRequestException('No customers to email');

    const subject = dto.subject.trim();
    const body = dto.body.trim();

    const record = await this.prisma.customerEmail.create({
      data: {
        tenantId,
        restaurantId,
        audience: dto.audience,
        customerId: dto.audience === 'ONE' ? dto.customerId : null,
        orderId: order?.id ?? null,
        subject,
        body,
        recipientCount: recipients.length,
      },
    });

    let sentCount = 0;
    let failedCount = 0;
    if (dto.audience === 'ONE') {
      const [recipient] = recipients;
      const text = this.buildBody(body, restaurant.name, order, promotional ? unsubscribeUrl(recipient.id, restaurantId) : undefined);
      const delivered = await this.deliver(tenantId, recipient, subject, text);
      sentCount = delivered ? 1 : 0;
      failedCount = delivered ? 0 : 1;
      await this.prisma.customerEmail.update({ where: { id: record.id }, data: { sentCount, failedCount } });
    } else {
      await this.prisma.customerEmailRecipient.createMany({
        data: recipients.map((r) => ({ emailId: record.id, customerId: r.id, email: r.email })),
      });
    }

    return {
      id: record.id,
      subject: record.subject,
      audience: record.audience,
      recipientLabel: dto.audience === 'ALL' ? 'All customers' : recipients[0].name,
      recipientCount: record.recipientCount,
      sentCount,
      failedCount,
      state: deliveryState({ recipientCount: record.recipientCount, sentCount, failedCount }),
      orderNumber: order?.orderNumber,
      sentAt: record.createdAt,
    };
  }

  /** Sends the next few waiting emails. Runs on a timer, so a long list is spread out and survives a restart. */
  async processQueue() {
    if (this.working) return;
    this.working = true;
    try {
      const waiting = await this.prisma.customerEmailRecipient.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: QUEUE_BATCH,
        include: { customerEmail: { select: { id: true, tenantId: true, restaurantId: true, subject: true, body: true } } },
      });
      if (!waiting.length) return;

      const restaurantNames = new Map<string, string>();
      for (const row of waiting) {
        const claimed = await this.prisma.customerEmailRecipient.updateMany({
          where: { id: row.id, status: 'PENDING' },
          data: { status: 'SENDING', attempts: { increment: 1 } },
        });
        if (claimed.count === 0) continue;
        await this.sendQueued(row, restaurantNames);
      }
    } catch (err) {
      this.logger.error('Sending queued emails failed', err as Error);
    } finally {
      this.working = false;
    }
  }

  private async sendQueued(
    row: { id: string; customerId: string; email: string; attempts: number; customerEmail: { id: string; tenantId: string; restaurantId: string; subject: string; body: string } },
    restaurantNames: Map<string, string>,
  ) {
    const { customerEmail: email } = row;

    const optedOut = await this.prisma.emailUnsubscribe.findUnique({
      where: { customerId_restaurantId: { customerId: row.customerId, restaurantId: email.restaurantId } },
    });
    if (optedOut) {
      // They unsubscribed after this was queued, so they are no longer one of the recipients.
      await this.prisma.$transaction([
        this.prisma.customerEmailRecipient.delete({ where: { id: row.id } }),
        this.prisma.customerEmail.update({ where: { id: email.id }, data: { recipientCount: { decrement: 1 } } }),
      ]);
      return;
    }

    let name = restaurantNames.get(email.restaurantId);
    if (name === undefined) {
      const restaurant = await this.prisma.restaurant.findUnique({ where: { id: email.restaurantId }, select: { name: true } });
      name = restaurant?.name ?? 'the restaurant';
      restaurantNames.set(email.restaurantId, name);
    }

    const text = this.buildBody(email.body, name, null, unsubscribeUrl(row.customerId, email.restaurantId));
    const delivered = await this.deliver(email.tenantId, { id: row.customerId, email: row.email }, email.subject, text);

    if (delivered) {
      await this.prisma.$transaction([
        this.prisma.customerEmailRecipient.update({ where: { id: row.id }, data: { status: 'SENT', sentAt: new Date() } }),
        this.prisma.customerEmail.update({ where: { id: email.id }, data: { sentCount: { increment: 1 } } }),
      ]);
    } else if (row.attempts + 1 >= MAX_ATTEMPTS) {
      await this.prisma.$transaction([
        this.prisma.customerEmailRecipient.update({ where: { id: row.id }, data: { status: 'FAILED' } }),
        this.prisma.customerEmail.update({ where: { id: email.id }, data: { failedCount: { increment: 1 } } }),
      ]);
    } else {
      await this.prisma.customerEmailRecipient.update({ where: { id: row.id }, data: { status: 'PENDING' } });
    }
  }

  private async deliver(tenantId: string, recipient: { id: string; email: string }, subject: string, body: string) {
    try {
      const result = await this.notifications.send({ tenantId, customerId: recipient.id, channel: 'EMAIL', recipient: recipient.email, subject, body });
      return result.status === 'SENT';
    } catch (err) {
      this.logger.error(`Email to ${recipient.email} failed`, err as Error);
      return false;
    }
  }

  private async assertDailyLimit(restaurantId: string, audience: 'ALL' | 'ONE') {
    const since = new Date(Date.now() - DAY_MS);
    const [total, broadcasts] = await Promise.all([
      this.prisma.customerEmail.count({ where: { restaurantId, createdAt: { gte: since } } }),
      this.prisma.customerEmail.count({ where: { restaurantId, audience: 'ALL', createdAt: { gte: since } } }),
    ]);
    if (total >= MAX_EMAILS_PER_DAY) {
      throw new HttpException(`Daily limit reached (${MAX_EMAILS_PER_DAY} emails per day). Try again tomorrow.`, HttpStatus.TOO_MANY_REQUESTS);
    }
    if (audience === 'ALL' && broadcasts >= MAX_BROADCASTS_PER_DAY) {
      throw new HttpException(`Daily limit reached (${MAX_BROADCASTS_PER_DAY} emails to all customers per day).`, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async resolveRecipients(tenantId: string, restaurantId: string, dto: SendCustomerEmailDto, promotional: boolean) {
    if (dto.audience === 'ALL') return (await this.customers(tenantId, restaurantId)).filter((c) => !c.unsubscribed);

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, isActive: true, orders: { some: { tenantId, restaurantId } } },
      select: { id: true, name: true, email: true },
    });
    if (!customer) throw new NotFoundException('Customer not found for this restaurant');

    if (promotional) {
      const optedOut = await this.prisma.emailUnsubscribe.findUnique({ where: { customerId_restaurantId: { customerId: customer.id, restaurantId } } });
      if (optedOut) throw new BadRequestException('This customer has unsubscribed from emails from your restaurant');
    }
    return [customer];
  }

  private async findOrderForCustomer(tenantId: string, restaurantId: string, customerId: string | undefined, orderId: string) {
    if (!customerId) throw new BadRequestException('An order can only be attached when emailing one customer');
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, restaurantId, customerId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        items: { select: { quantity: true, menuItem: { select: { name: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Order not found for this customer');
    return order;
  }

  private buildBody(
    body: string,
    restaurantName: string,
    order: { orderNumber: string; status: string; total: number; items: { quantity: number; menuItem: { name: string } }[] } | null,
    unsubscribe?: string,
  ) {
    const parts = [body];
    if (order) {
      const items = order.items.map((i) => `${i.quantity} × ${i.menuItem.name}`).join(', ');
      parts.push(`Order ${order.orderNumber} (${order.status})\n${items}\nTotal: ${order.total}`);
    }
    parts.push(`— ${restaurantName}`);
    if (unsubscribe) parts.push(emailFooter(restaurantName, unsubscribe));
    return parts.join('\n\n');
  }

  private parseToken(token: string) {
    const parsed = readUnsubscribeToken(token);
    if (!parsed) throw new BadRequestException('This unsubscribe link is not valid');
    return parsed;
  }

  private async restaurantName(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { name: true } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant.name;
  }

  async unsubscribeStatus(token: string) {
    const { customerId, restaurantId } = this.parseToken(token);
    const [restaurantName, existing] = await Promise.all([
      this.restaurantName(restaurantId),
      this.prisma.emailUnsubscribe.findUnique({ where: { customerId_restaurantId: { customerId, restaurantId } } }),
    ]);
    return { restaurantName, unsubscribed: !!existing };
  }

  async unsubscribe(token: string) {
    const { customerId, restaurantId } = this.parseToken(token);
    const restaurantName = await this.restaurantName(restaurantId);
    await this.prisma.emailUnsubscribe.upsert({
      where: { customerId_restaurantId: { customerId, restaurantId } },
      create: { customerId, restaurantId },
      update: {},
    });
    return { restaurantName, unsubscribed: true };
  }

  async resubscribe(token: string) {
    const { customerId, restaurantId } = this.parseToken(token);
    const restaurantName = await this.restaurantName(restaurantId);
    await this.prisma.emailUnsubscribe.deleteMany({ where: { customerId, restaurantId } });
    return { restaurantName, unsubscribed: false };
  }
}
