// src/modules/delivery/delivery.service.ts
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateDeliveryPersonDto, LoginDeliveryPersonDto, UpdateLocationDto, UpdateDeliveryStatusDto } from './dto/delivery.dto';
import type { CourierBooking, DeliveryEvent } from './integration/delivery-provider';

const SALT_ROUNDS = 10;

const EXTERNAL_STEPS = ['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];

type Assignee = {
  deliveryPersonId?: string;
  provider?: string;
  externalRef?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  trackingUrl?: string;
};

const NEXT_DELIVERY_STATUSES: Record<string, string[]> = {
  ASSIGNED: ['PICKED_UP', 'FAILED'],
  PICKED_UP: ['ON_THE_WAY', 'FAILED'],
  ON_THE_WAY: ['DELIVERED', 'FAILED'],
};

export function canMoveDeliveryStatus(from: string, to: string) {
  return (NEXT_DELIVERY_STATUSES[from] ?? []).includes(to);
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  // ---------- Owner-facing: Delivery Person management ----------

  async createDeliveryPerson(tenantId: string, dto: CreateDeliveryPersonDto) {
    const existing = await this.prisma.deliveryPerson.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('A delivery person with this phone already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.prisma.deliveryPerson.create({
      data: { tenantId, name: dto.name, phone: dto.phone, passwordHash, vehicleType: dto.vehicleType },
    });
  }

  async findAllForTenant(tenantId: string) {
    return this.prisma.deliveryPerson.findMany({
      where: {
        OR: [
          // 1. Delivery persons dedicated to this specific restaurant
          { tenantId: tenantId },
          // 2. Independent freelancers registered to the SaaS (tenantId: null) who are currently active and available
          { tenantId: null, isActive: true, isAvailable: true }
        ]
      },
      orderBy: [
        // Sort dedicated staff first, then by name
        { tenantId: 'desc' }, 
        { name: 'asc' }
      ]
    });
  }

  // ---------- Delivery Person Auth ----------

  /**
   * selfRegister()
   * ----------------
   * GAP FIX: पहिले delivery person owner ले मात्र थप्न सक्थे (restaurant
   * सँग tied)। अब independent/freelance rider (कुनै specific restaurant
   * सँग नबाँधिएको, tenantId: null) आफैं register गर्न सक्छन् — यसले
   * platform-wide delivery marketplace लाई सम्भव बनाउँछ।
   */
  async selfRegister(dto: CreateDeliveryPersonDto) {
    const existing = await this.prisma.deliveryPerson.findUnique({ where: { phone: dto.phone } });
    if (existing) throw new ConflictException('A delivery person with this phone already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.prisma.deliveryPerson.create({
      data: { tenantId: null, name: dto.name, phone: dto.phone, passwordHash, vehicleType: dto.vehicleType },
    });
  }

  /** GAP FIX: Delivery person ले आफ्नो कुल कमाइ हेर्ने ठाउँ थिएन */
  async getEarningsSummary(deliveryPersonId: string) {
    const stats = await this.prisma.delivery.aggregate({
      where: { deliveryPersonId, status: 'DELIVERED' },
      _sum: { earningAmount: true },
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        totalDeliveriesCompleted: stats._count.id,
        totalEarnings: stats._sum.earningAmount ?? 0,
      },
    };
  }

  async login(dto: LoginDeliveryPersonDto) {
    const person = await this.prisma.deliveryPerson.findUnique({ where: { phone: dto.phone } });
    if (!person || !person.isActive) throw new UnauthorizedException('Invalid credentials');

    const matches = await bcrypt.compare(dto.password, person.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: person.id, phone: person.phone, type: 'delivery' };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });

    return { success: true, data: { deliveryPerson: { id: person.id, name: person.name, phone: person.phone }, accessToken } };
  }

  // ---------- Delivery Person-facing: Orders ----------

  /** Restaurant ले "Ready" बनाइसकेको, अझै कसैलाई assign नभएको order हरू — gig-marketplace जस्तो "available job" list */
        async findAvailableOrders() {
    return this.prisma.order.findMany({
      where: {
        orderType: 'DELIVERY',
        status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] },
        AND: [
          { OR: [{ delivery: null }, { delivery: { status: 'UNASSIGNED' } }] },
          { OR: [{ deliveryHandledBy: null }, { deliveryHandledBy: { not: 'SELF_DELIVERY' } }] },
        ],
      },
      include: {
        restaurant: { select: { name: true, address: true, latitude: true, longitude: true } },
        customer: { select: { name: true, phone: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async acceptOrder(deliveryPersonId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { delivery: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.orderType !== 'DELIVERY' || order.deliveryHandledBy === 'SELF_DELIVERY') {
      throw new BadRequestException('This order is not open for delivery partners');
    }
    if (order.status !== 'READY') throw new BadRequestException('Order is not ready for pickup yet');

    return this.claim(order, { deliveryPersonId });
  }

  private async claim(order: { id: string; delivery: { status: string } | null }, assignee: Assignee) {
    const orderId = order.id;
    const taken = new BadRequestException('This order has already been assigned to another delivery person');
    const assignment = { ...assignee, status: 'ASSIGNED' as const, assignedAt: new Date() };

    if (order.delivery) {
      const claimed = await this.prisma.delivery.updateMany({ where: { orderId, status: 'UNASSIGNED' }, data: assignment });
      if (claimed.count === 0) throw taken;
    } else {
      try {
        await this.prisma.delivery.create({ data: { orderId, ...assignment } });
      } catch (err) {
        if ((err as { code?: string }).code === 'P2002') throw taken;
        throw err;
      }
    }

    const delivery = await this.prisma.delivery.findUnique({ where: { orderId } });
    return { success: true, data: delivery };
  }

  async applyExternalEvent(provider: string, event: DeliveryEvent) {
    const order = await this.prisma.order.findUnique({ where: { id: event.orderId }, include: { delivery: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.orderType !== 'DELIVERY' || order.deliveryHandledBy === 'SELF_DELIVERY') {
      throw new BadRequestException('This order is not open for delivery partners');
    }

    const assignee = {
      provider,
      externalRef: event.externalRef,
      driverName: event.driver?.name,
      driverPhone: event.driver?.phone,
      driverVehicle: event.driver?.vehicle,
      trackingUrl: event.trackingUrl,
    };

    if (event.event === 'ASSIGNED') {
      if (order.delivery?.provider === provider) {
        if (order.delivery.status === 'ASSIGNED') await this.prisma.delivery.update({ where: { orderId: order.id }, data: assignee });
        return { success: true, message: 'Delivery status updated' };
      }
      if (order.status !== 'READY') throw new BadRequestException('Order is not ready for pickup yet');
      if (order.delivery?.externalRef && event.externalRef && order.delivery.externalRef !== event.externalRef) {
        throw new BadRequestException('This delivery does not match the booking for the order');
      }
      return this.claim(order, assignee);
    }

    if (!order.delivery || order.delivery.provider !== provider) {
      throw new NotFoundException('Delivery assignment not found for this order');
    }

    let current: string = order.delivery.status;
    const from = EXTERNAL_STEPS.indexOf(current);
    const to = EXTERNAL_STEPS.indexOf(event.event);
    if (from >= 0 && to > from + 1) {
      for (const step of EXTERNAL_STEPS.slice(from + 1, to)) {
        await this.applyStatus({ orderId: order.id, status: current }, step, undefined, provider);
        current = step;
      }
    }
    return this.applyStatus({ orderId: order.id, status: current }, event.event, event.failureReason, provider);
  }

  async recordBooking(orderId: string, booking: CourierBooking) {
    await this.prisma.delivery.update({ where: { orderId }, data: { externalRef: booking.externalRef, trackingUrl: booking.trackingUrl } });
  }

  /**
   * rejectOrder()
   * --------------
   * Delivery person ले offer गरिएको delivery अस्वीकार गर्ने। Delivery
   * status "UNASSIGNED" मै रहन्छ ताकि अरू nearby delivery person ले
   * (जसलाई पनि notify भएको थियो) अझै accept गर्न सकून् — reject गर्नेलाई
   * मात्र यो order फेरि नदेखियोस् भनेर सजिलो client-side filter गर्न
   * मिल्ने गरी response दिइन्छ।
   */
  async rejectOrder(deliveryPersonId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // यहाँ हामी order लाई अरूको लागि उपलब्ध नै राख्छौं (status बदलिँदैन) —
    // केवल यो delivery person ले "मैले अस्वीकार गरें" भन्ने पुष्टि गर्छौं।
    return { success: true, message: 'Delivery request declined. It remains available for other delivery partners.' };
  }

  /**
   * updateStatus()
   * ---------------
   * Delivery status बदलिँदा सम्बन्धित Order.status पनि सँगै sync हुन्छ,
   * ताकि customer/owner ले Order status हेर्दा नै delivery progress देखून्।
   */
  async updateStatus(deliveryPersonId: string, orderId: string, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.prisma.delivery.findUnique({ where: { orderId } });
    if (!delivery || delivery.deliveryPersonId !== deliveryPersonId) {
      throw new NotFoundException('Delivery assignment not found for this order');
    }
    return this.applyStatus(delivery, dto.status, dto.failureReason, deliveryPersonId);
  }

  private async applyStatus(delivery: { orderId: string; status: string }, status: string, failureReason: string | undefined, changedBy: string) {
    const orderId = delivery.orderId;
    if (delivery.status === status) return { success: true, message: 'Delivery status updated' };
    if (!canMoveDeliveryStatus(delivery.status, status)) {
      throw new BadRequestException(`Delivery cannot move from ${delivery.status} to ${status}`);
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'CANCELLED') throw new BadRequestException('This order was cancelled');

    const timestampField = status === 'PICKED_UP' ? { pickedUpAt: new Date() } : status === 'DELIVERED' ? { deliveredAt: new Date() } : {};
    const orderStatus = status === 'ON_THE_WAY' ? 'OUT_FOR_DELIVERY' : order.status;
    const note = status === 'FAILED' ? `Delivery failed${failureReason ? `: ${failureReason}` : ''}` : `Rider: ${status}`;

    await this.prisma.$transaction([
      this.prisma.delivery.update({
        where: { orderId },
        data: { status: status as any, failureReason, ...timestampField },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: orderStatus as any },
      }),
      this.prisma.orderStatusHistory.create({
        data: { orderId, status: orderStatus as any, note, changedBy },
      }),
    ]);

    if (orderStatus !== order.status) {
      void this.notificationService
        .notifyOrderStatusChange(order.customerId, order.tenantId, order.orderNumber, orderStatus)
        .catch((err) => this.logger.error(`Order status email failed for ${order.orderNumber}`, err as Error));
    }

    return { success: true, message: 'Delivery status updated' };
  }

  async updateLocation(deliveryPersonId: string, dto: UpdateLocationDto) {
    await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: { currentLatitude: dto.latitude, currentLongitude: dto.longitude },
    });
    return { success: true, message: 'Location updated' };
  }

  async updateAvailability(deliveryPersonId: string, isAvailable: boolean) {
    return this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: { isAvailable },
      select: {
        id: true,
        name: true,
        phone: true,
        vehicleType: true,
        isAvailable: true,
        isActive: true,
      },
    });
  }

    async findMyDeliveries(deliveryPersonId: string) {
    return this.prisma.delivery.findMany({
      where: { deliveryPersonId },
      include: {
        order: {
          include: {
            restaurant: { select: { name: true, address: true, latitude: true, longitude: true } },
            customer: { select: { name: true, phone: true } },
            items: { include: { menuItem: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
