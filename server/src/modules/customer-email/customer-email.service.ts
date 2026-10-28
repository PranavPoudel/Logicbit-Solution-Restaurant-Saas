import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SendCustomerEmailDto } from './dto/send-customer-email.dto';

const MAX_EMAILS_PER_DAY = 20;
const MAX_BROADCASTS_PER_DAY = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 10;

@Injectable()
export class CustomerEmailService {
  private readonly logger = new Logger(CustomerEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

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
    const customers = await this.prisma.customer.findMany({
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
    });

    const orderCount = new Map(counts.map((c) => [c.customerId, c._count._all]));
    return customers
      .map((c) => ({ ...c, orders: orderCount.get(c.id) ?? 0 }))
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
      orderNumber: s.orderId ? orderNumber.get(s.orderId) : undefined,
      sentAt: s.createdAt,
    }));
  }

  async send(tenantId: string, restaurantId: string, dto: SendCustomerEmailDto) {
    const restaurant = await this.assertRestaurant(tenantId, restaurantId);
    await this.assertDailyLimit(restaurantId, dto.audience);

    const recipients = await this.resolveRecipients(tenantId, restaurantId, dto);
    if (!recipients.length) throw new BadRequestException('No customers to email');

    const order = dto.orderId ? await this.findOrderForCustomer(tenantId, restaurantId, dto.customerId, dto.orderId) : null;
    const subject = dto.subject.trim();
    const text = this.buildBody(dto.body.trim(), restaurant.name, order);

    const record = await this.prisma.customerEmail.create({
      data: {
        tenantId,
        restaurantId,
        audience: dto.audience,
        customerId: dto.audience === 'ONE' ? dto.customerId : null,
        orderId: order?.id ?? null,
        subject,
        body: dto.body.trim(),
        recipientCount: recipients.length,
      },
    });

    const dispatch = this.dispatchAll(tenantId, recipients, subject, text);
    if (dto.audience === 'ONE') await dispatch;
    else void dispatch;

    return {
      id: record.id,
      subject: record.subject,
      audience: record.audience,
      recipientLabel: dto.audience === 'ALL' ? 'All customers' : recipients[0].name,
      recipientCount: record.recipientCount,
      orderNumber: order?.orderNumber,
      sentAt: record.createdAt,
    };
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

  private async resolveRecipients(tenantId: string, restaurantId: string, dto: SendCustomerEmailDto) {
    if (dto.audience === 'ALL') return this.customers(tenantId, restaurantId);

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, isActive: true, orders: { some: { tenantId, restaurantId } } },
      select: { id: true, name: true, email: true },
    });
    if (!customer) throw new NotFoundException('Customer not found for this restaurant');
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
  ) {
    const parts = [body];
    if (order) {
      const items = order.items.map((i) => `${i.quantity} × ${i.menuItem.name}`).join(', ');
      parts.push(`Order ${order.orderNumber} (${order.status})\n${items}\nTotal: ${order.total}`);
    }
    parts.push(`— ${restaurantName}`);
    return parts.join('\n\n');
  }

  private async dispatchAll(tenantId: string, recipients: { id: string; email: string }[], subject: string, body: string) {
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((r) =>
          this.notifications.send({ tenantId, customerId: r.id, channel: 'EMAIL', recipient: r.email, subject, body }).catch((err) => {
            this.logger.error(`Email to ${r.email} failed`, err as Error);
          }),
        ),
      );
    }
  }
}
