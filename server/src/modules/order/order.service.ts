//src/modules/order/order.service.ts
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponService } from '../coupon/coupon.service';
import { PaymentService } from '../payment/payment.service';
import { NotificationService } from '../notification/notification.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { haversineDistanceKm } from '../../common/utils/haversine.util';
import { calculateDeliveryQuote } from '../../common/utils/delivery-fee.util';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, CancelOrderDto } from './dto/update-order-status.dto';
import { IssueRefundDto } from './dto/issue-refund.dto';
import { DeliveryIntegrationService } from '../delivery/integration/delivery-integration.service';
import { computeOpenStatus } from '../../common/utils/opening-hours.util';

const CANCELLABLE_STATUSES = ['PENDING', 'ACCEPTED'];
const TERMINAL_STATUSES = ['DELIVERED', 'COMPLETED', 'CANCELLED'];

const NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ['ACCEPTED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'COMPLETED'],
};

export function canMoveOrderStatus(from: string, to: string) {
  return from === to || (NEXT_STATUSES[from] ?? []).includes(to);
}

export function deliveryBlockedReason(
  order: { orderType: string; deliveryHandledBy?: string | null; delivery?: { deliveryPersonId?: string | null; provider?: string | null; status?: string } | null },
  to: string,
) {
  if (order.orderType !== 'DELIVERY' || order.deliveryHandledBy !== 'THIRD_PARTY') return null;
  const assigned = !!(order.delivery?.deliveryPersonId || order.delivery?.provider);
  if (to === 'OUT_FOR_DELIVERY' && !assigned) return 'A delivery partner must accept this order before it can go out';
  if ((to === 'DELIVERED' || to === 'COMPLETED') && order.delivery?.status !== 'DELIVERED') {
    return assigned ? 'The delivery partner has not marked this order as delivered yet' : 'A delivery partner must accept this order before it can go out';
  }
  return null;
}

export function ownDeliveryBlockedReason(
  order: { orderType: string; deliveryHandledBy?: string | null; delivery?: { deliveryPersonId?: string | null; provider?: string | null } | null },
) {
  if (order.orderType !== 'DELIVERY') return 'Only delivery orders have a delivery partner';
  if (order.deliveryHandledBy !== 'THIRD_PARTY') return 'This order is already delivered by your own riders';
  if (order.delivery?.deliveryPersonId || order.delivery?.provider) return 'A delivery partner has already accepted this order';
  return null;
}

export function refundBlockedReason(order: { paymentStatus: string; total: number; refund?: { status: string } | null }, amount: number) {
  if (order.refund?.status === 'PROCESSED' || order.paymentStatus === 'REFUNDED') return 'This order has already been refunded';
  if (order.paymentStatus !== 'PAID') return 'Only paid orders can be refunded';
  if (amount > order.total) return 'The refund cannot be more than the order total';
  return null;
}

/** PayPay can send the money back itself only when the customer paid through PayPay; otherwise it is recorded like cash */
export function refundGoesThroughPayPay(order: { paymentMethod?: string | null }, method: string) {
  return method === 'PAYPAY' && order.paymentMethod === 'PAYPAY';
}

export function refundMethodBlockedReason(order: { paymentMethod?: string | null; refund?: { method?: string | null; status: string } | null }, method: string) {
  if (!refundGoesThroughPayPay(order, method) && order.refund?.method === 'PAYPAY' && order.refund.status === 'PENDING') {
    return 'A PayPay refund is still waiting for PayPay. Retry it to check its status before refunding another way';
  }
  return null;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly couponService: CouponService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
    private readonly activityLog: ActivityLogService,
    private readonly deliveryIntegration: DeliveryIntegrationService,
  ) {}

  async previewCoupon(customerId: string, restaurantId: string, code: string, subtotal: number) {
    const { coupon, discountAmount } = await this.couponService.validateAndCalculate(restaurantId, customerId, code.trim(), subtotal);
    return { code: coupon.code, discountAmount };
  }

  /**
   * checkout()
   * -----------
   * Customer-facing। Cart items लाई validate गरेर, price/modifier/coupon
   * सबै calculate गरेर Order बनाउँछ। यही function नै सम्पूर्ण checkout को
   * "single source of truth" हो — price कुनै पनि हालतमा frontend बाट
   * विश्वास गरिँदैन, हरेक पटक backend मा DB बाट taजा price निकालेर पुनः
   * calculate गरिन्छ (यसले price tampering/manipulation रोक्छ)।
   */
  async checkout(customerId: string, dto: CreateOrderDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: dto.restaurantId, isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (!computeOpenStatus(restaurant).isOpen) throw new BadRequestException('This restaurant is currently closed');

    // --- 1. हरेक item को price DB बाट taजा निकालेर calculate गर्ने ---
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const inputItem of dto.items) {
      const menuItem = await this.prisma.menuItem.findFirst({
        where: {
          id: inputItem.menuItemId,
          restaurantId: dto.restaurantId,
          deletedAt: null,
          isAvailable: true,
        },
      });
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${inputItem.menuItemId} is unavailable or does not exist`);
      }

      // यो MenuItem सँग link भएका सबै ModifierGroup निकाल्ने — ताकि customer ले
      // कुनै अर्को (unlinked) group को option जबरजस्ती apply गर्न नसकोस्, र
      // required group छुटेको भए error देखाउन सकियोस्।
      const linkedGroups = await this.prisma.menuItemModifierGroup.findMany({
        where: { menuItemId: menuItem.id },
        include: { modifierGroup: true },
      });
      const linkedGroupIds = new Set(linkedGroups.map((g) => g.modifierGroupId));

      let modifierTotal = 0;
      const resolvedModifiers: any[] = [];
      const selectedGroupCounts = new Map<string, number>();

      for (const mod of inputItem.selectedModifiers ?? []) {
        if (!linkedGroupIds.has(mod.modifierGroupId)) {
          throw new BadRequestException(`Modifier group ${mod.modifierGroupId} is not available for "${menuItem.name}"`);
        }

        const option = await this.prisma.modifierOption.findFirst({
          where: { id: mod.modifierOptionId, modifierGroupId: mod.modifierGroupId, isAvailable: true },
        });
        if (!option) {
          throw new BadRequestException(`Selected modifier option is unavailable`);
        }

        modifierTotal += option.extraPrice;
        resolvedModifiers.push({ groupId: mod.modifierGroupId, optionId: option.id, name: option.name, price: option.extraPrice, allergenInfo: option.allergenInfo });
        selectedGroupCounts.set(mod.modifierGroupId, (selectedGroupCounts.get(mod.modifierGroupId) ?? 0) + 1);
      }

      // हरेक linked group को लागि isRequired/minSelect/maxSelect rule जाँच्ने
      for (const link of linkedGroups) {
        const group = link.modifierGroup;
        const count = selectedGroupCounts.get(group.id) ?? 0;

        if (group.isRequired && count === 0) {
          throw new BadRequestException(`"${group.name}" selection is required for "${menuItem.name}"`);
        }
        if (count < group.minSelect) {
          throw new BadRequestException(`Please select at least ${group.minSelect} option(s) for "${group.name}"`);
        }
        if (count > group.maxSelect) {
          throw new BadRequestException(`You can select at most ${group.maxSelect} option(s) for "${group.name}"`);
        }
      }

      const unitPrice = menuItem.price + modifierTotal;
      const itemSubtotal = unitPrice * inputItem.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        menuItemId: menuItem.id,
        quantity: inputItem.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        selectedModifiers: resolvedModifiers,
        notes: inputItem.notes,
      });
    }

    // --- 2. Coupon (optional) ---
    let discountAmount = 0;
    let appliedCoupon: any = null;
    if (dto.couponCode) {
      const result = await this.couponService.validateAndCalculate(dto.restaurantId, customerId, dto.couponCode, subtotal);
      discountAmount = result.discountAmount;
      appliedCoupon = result.coupon;
    }

    // --- 3. Delivery Fee (simple flat rule; भविष्यमा distance-based बनाउन सकिन्छ) ---
    // --- Delivery Fee (Distance-tiered — Restaurant को setting अनुसार) ---
    let deliveryFee = 0;
    let deliveryDistanceKm: number | undefined;
    let deliveryHandledBy: 'SELF_DELIVERY' | 'THIRD_PARTY' | undefined;

    if (dto.orderType === 'DELIVERY') {
      if (dto.deliveryLatitude == null || dto.deliveryLongitude == null) {
        throw new BadRequestException('Delivery location (latitude/longitude) is required for delivery orders');
      }
      if (restaurant.latitude == null || restaurant.longitude == null) {
        throw new BadRequestException('This restaurant has not set up its location yet, delivery is unavailable');
      }

      const quote = calculateDeliveryQuote({
        restaurantLat: restaurant.latitude,
        restaurantLng: restaurant.longitude,
        customerLat: dto.deliveryLatitude,
        customerLng: dto.deliveryLongitude,
        selfDeliveryRadiusKm: restaurant.selfDeliveryRadiusKm,
        maxDeliveryRadiusKm: restaurant.maxDeliveryRadiusKm,
        selfDeliveryFeeType: restaurant.selfDeliveryFeeType as any,
        selfDeliveryFlatFee: restaurant.selfDeliveryFlatFee,
        selfDeliveryPerKmFee: restaurant.selfDeliveryPerKmFee,
        thirdPartyFeeType: restaurant.thirdPartyFeeType as any,
        thirdPartyBaseFee: restaurant.thirdPartyBaseFee,
        thirdPartyPerKmFee: restaurant.thirdPartyPerKmFee,
      });

      if (!quote.deliverable) {
        throw new BadRequestException(quote.reason ?? 'Delivery is not available to this location');
      }

      deliveryFee = quote.deliveryFee;
      deliveryDistanceKm = quote.distanceKm;
      deliveryHandledBy = quote.handledBy;
    }

    const tax = 0; // भविष्यमा restaurant/country अनुसार tax rate थप्न सकिन्छ
    const total = Math.max(0, subtotal - discountAmount + deliveryFee + tax);

    // --- Platform Commission (तपाईंको आम्दानी) ---
    // Commission खाना बेचेको (subtotal - discount) माथि मात्र calculate हुन्छ,
    // delivery fee माथि होइन (delivery fee सामान्यतया restaurant/delivery
    // person लाई नै जान्छ, platform ले खाना बिक्रीबाट मात्र कमिशन लिन्छ)।
    const commissionableAmount = Math.max(0, subtotal - discountAmount);
    const platformCommissionAmount = Number(((commissionableAmount * restaurant.platformCommissionPercent) / 100).toFixed(2));

    const orderNumber = this.generateOrderNumber();

    // --- 4. Payment initiate (COD ले तुरुन्तै UNPAID confirm गर्छ) ---
    const paymentMethod = dto.paymentMethod ?? 'COD';
    const paymentResult = await this.paymentService.initiate(paymentMethod, orderNumber, total, restaurant.currencyCode);

    // --- 5. Transaction: Order + Items + StatusHistory + CouponUsage ---
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tenantId: restaurant.tenantId,
          restaurantId: restaurant.id,
          customerId,
          orderNumber,
          orderType: dto.orderType,
          subtotal,
          deliveryFee,
          tax,
          discountAmount,
          couponCode: appliedCoupon?.code,
          total,
          currencyCode: restaurant.currencyCode,
          platformCommissionAmount,
          deliveryAddress: dto.deliveryAddress,
          deliveryLatitude: dto.deliveryLatitude,
          deliveryLongitude: dto.deliveryLongitude,
          deliveryDistanceKm,
          deliveryHandledBy: deliveryHandledBy as any,
          paymentMethod: paymentMethod as any,
          paymentStatus: paymentResult.paymentStatus as any,
          items: { create: orderItemsData },
        },
        include: { items: { include: { menuItem: true } } },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: created.id, status: 'PENDING', note: 'Order placed', changedBy: customerId },
      });

      if (appliedCoupon) {
        await tx.coupon.update({ where: { id: appliedCoupon.id }, data: { usedCount: { increment: 1 } } });
        await tx.couponUsage.create({
          data: { couponId: appliedCoupon.id, customerId, orderId: created.id, discountAmount },
        });
      }

      return created;
    });

    // GAP FIX: पहिले Restaurant Owner लाई नयाँ order आयो भनेर कहिल्यै
    // notify हुँदैनथ्यो — owner ले dashboard खोलेर पटक-पटक हेर्नुपर्थ्यो।
    // अब checkout हुनेबित्तिकै owner लाई notification जान्छ।
    await this.notifyRestaurantOwner(restaurant.tenantId, order.orderNumber, order.total, restaurant.currencyCode);

    await this.activityLog.log({
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      actorType: 'CUSTOMER',
      actorId: customerId,
      action: 'ORDER_CREATED',
      description: `Order ${order.orderNumber} placed (${restaurant.currencyCode} ${total})`,
      metadata: { orderId: order.id, total },
    });

    return { success: true, message: 'Order placed successfully', data: order };
  }

  /** Restaurant Owner (tenant का सबै user) लाई नयाँ order बारे notify गर्ने */
  private async notifyRestaurantOwner(tenantId: string, orderNumber: string, total: number, currencyCode: string) {
    const owners = await this.prisma.user.findMany({ where: { tenantId, isActive: true } });
    for (const owner of owners) {
      await this.notificationService.send({
        tenantId,
        channel: 'EMAIL',
        recipient: owner.email,
        subject: `New order ${orderNumber}`,
        body: `You have a new order ${orderNumber} worth ${currencyCode} ${total}. Please check your dashboard.`,
      });
    }
  }

  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: true } },
        restaurant: { select: { id: true, name: true, address: true, phone: true, refundPolicy: true, latitude: true, longitude: true, currencyCode: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        refund: true,
        delivery: {
          include: { deliveryPerson: { select: { id: true, name: true, phone: true, currentLatitude: true, currentLongitude: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /** Customer-facing — आफ्नो मात्र order हेर्ने */
  async findOneForCustomer(customerId: string, orderId: string) {
    const order = await this.findOne(orderId);
    if (order.customerId !== customerId) throw new NotFoundException('Order not found');
    return order;
  }

  async findAllForCustomer(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { menuItem: true } }, restaurant: { select: { id: true, name: true, currencyCode: true } }, refund: true },
    });
  }

  /** Owner-facing — आफ्नो restaurant का मात्र order */
   async findAllForRestaurant(
    tenantId: string, 
    restaurantId: string, 
    status?: string, 
    startDate?: string, 
    endDate?: string
  ) {
    const whereClause: any = { tenantId, restaurantId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate); // End of day handled by frontend or we can add 23:59:59
    }

    return this.prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        customer: { select: { name: true, phone: true } },
        refund: true,
        delivery: { include: { deliveryPerson: { select: { id: true, name: true, phone: true, vehicleType: true } } } },
      },
    });
  }

  async findOneForRestaurant(tenantId: string, restaurantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, restaurantId },
      include: {
        items: { include: { menuItem: true } },
        customer: { select: { name: true, phone: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        refund: true,
        delivery: {
          include: { deliveryPerson: { select: { id: true, name: true, phone: true, currentLatitude: true, currentLongitude: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Owner-facing — refunds an order. Cash, bank transfer and other methods record money the restaurant already
   * paid back. PayPay sends the refund through the restaurant's own PayPay account and only counts it once PayPay confirms.
   */
  async issueRefund(tenantId: string, restaurantId: string, orderId: string, dto: IssueRefundDto, issuedBy: string) {
    const order = await this.findOneForRestaurant(tenantId, restaurantId, orderId);
    const blocked = refundBlockedReason(order, dto.amount) ?? refundMethodBlockedReason(order, dto.method);
    if (blocked) throw new BadRequestException(blocked);

    let reference = dto.reference?.trim() || null;

    if (refundGoesThroughPayPay(order, dto.method)) {
      const resume = order.refund?.method === 'PAYPAY' && order.refund.status === 'PENDING' ? order.refund.reference ?? undefined : undefined;
      const result = await this.paymentService.refund('PAYPAY', orderId, dto.amount, resume);
      reference = result.providerReference ?? null;

      if (result.status !== 'COMPLETED') {
        const failed = result.status === 'FAILED';
        const data = {
          amount: dto.amount,
          reason: dto.reason,
          method: dto.method,
          reference,
          status: failed ? ('FAILED' as const) : ('PENDING' as const),
          failureReason: failed ? result.message ?? 'PayPay did not accept the refund' : null,
          processedAt: null,
        };
        const saved = await this.prisma.refund.upsert({ where: { orderId }, create: { orderId, ...data }, update: data });
        if (failed) throw new BadRequestException(`PayPay refund failed: ${data.failureReason}`);
        return { success: true, data: saved };
      }
    }

    const refund = await this.prisma.$transaction(async (tx) => {
      const data = { amount: dto.amount, status: 'PROCESSED' as const, reason: dto.reason, method: dto.method, reference, failureReason: null, processedAt: new Date() };
      const saved = await tx.refund.upsert({ where: { orderId }, create: { orderId, ...data }, update: data });
      await tx.order.update({ where: { id: orderId }, data: { paymentStatus: 'REFUNDED' } });
      await tx.orderStatusHistory.create({
        data: { orderId, status: order.status, note: `Refund issued: ${dto.reason}`, changedBy: issuedBy },
      });
      return saved;
    });

    void this.notificationService
      .notifyRefundIssued(order.customerId, tenantId, order.orderNumber, dto.amount, dto.reason, dto.method, reference)
      .catch((err) => this.logger.error(`Refund email failed for ${order.orderNumber}`, err as Error));

    await this.activityLog.log({
      tenantId,
      restaurantId,
      actorType: 'OWNER',
      actorId: issuedBy,
      action: 'ORDER_REFUNDED',
      description: `Order ${order.orderNumber} refunded ${dto.amount} by ${dto.method}: ${dto.reason}`,
      metadata: { orderId, amount: dto.amount, method: dto.method },
    });

    return { success: true, data: refund };
  }

  async emailPreview(tenantId: string, restaurantId: string, orderId: string) {
    await this.findOneForRestaurant(tenantId, restaurantId, orderId);
    const built = await this.notificationService.buildOrderConfirmation(orderId);
    return { to: built?.recipient, ...built?.email };
  }

  /** Owner-facing — status update (Accept/Preparing/Ready/Delivered...) */
  async updateStatus(tenantId: string, restaurantId: string, orderId: string, dto: UpdateOrderStatusDto, changedBy: string) {
    const order = await this.findOneForRestaurant(tenantId, restaurantId, orderId);
    if (TERMINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(`Order is already ${order.status}, status cannot be changed further`);
    }
    if (!canMoveOrderStatus(order.status, dto.status)) {
      throw new BadRequestException(`Order cannot move from ${order.status} to ${dto.status}`);
    }
    const waiting = deliveryBlockedReason(order, dto.status);
    if (waiting) throw new BadRequestException(waiting);

    const updated = await this.prisma.$transaction(async (tx) => {
      const shouldMarkPaid = order.paymentMethod === 'COD' && ['DELIVERED', 'COMPLETED'].includes(dto.status);

      const result = await tx.order.update({
        where: { id: orderId },
        data: {
          status: dto.status as any,
          ...(shouldMarkPaid ? { paymentStatus: 'PAID' } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status: dto.status as any, note: dto.note, changedBy },
      });

      return result;
    });

    if (dto.status === 'ACCEPTED') {
      if (order.status !== 'ACCEPTED') {
        void this.notificationService.notifyOrderAccepted(orderId).catch((err) => this.logger.error(`Order confirmation email failed for ${order.orderNumber}`, err as Error));
      }
    } else {
      await this.notificationService.notifyOrderStatusChange(order.customerId, tenantId, order.orderNumber, dto.status);
    }

    await this.activityLog.log({
      tenantId,
      restaurantId,
      actorType: 'OWNER',
      actorId: changedBy,
      action: 'ORDER_STATUS_CHANGED',
      description: `Order ${order.orderNumber} status changed to ${dto.status}`,
      metadata: { orderId, newStatus: dto.status },
    });

    // GAP FIX: Order "READY" भएपछि, delivery order (pickup/dine-in होइन) भए
    // मात्र delivery dispatch गर्ने। Restaurant.deliveryMode अनुसार निर्णय:
    //  - SELF_DELIVERY  → third-party delivery person लाई कहिल्यै notify हुँदैन,
    //                     restaurant आफैंले (आफ्नै staff/rider ले) deliver गर्छ
    //  - THIRD_PARTY    → nearby, available delivery person हरूलाई notify गरिन्छ
    if (dto.status === 'READY' && order.orderType === 'DELIVERY') {
      await this.dispatchDelivery(order);
    }

    return { success: true, data: updated };
  }

  /**
   * dispatchDelivery()
   * ---------------------
   * GAP FIX: पहिले restaurant-wide global `deliveryMode` हेरिन्थ्यो, तर
   * वास्तविकतामा त्यो distance-अनुसार फरक हुन्छ (नजिक भए आफैं, टाढा भए
   * third-party)। अब checkout बेलैमा calculate भइसकेको यही specific
   * order को `deliveryHandledBy` हेरिन्छ — यही ठिक तरिका हो।
   */
  private async dispatchDelivery(order: any) {
    if (order.deliveryHandledBy === 'SELF_DELIVERY') {
      // Restaurant आफैंले (यो order को हकमा नजिकै भएकोले) deliver गर्ने
      // भएकोले third-party लाई notify गरिँदैन।
      return;
    }

    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: order.restaurantId } });
    if (!restaurant) return;

    await this.prisma.delivery.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, status: 'UNASSIGNED', earningAmount: order.deliveryFee },
      update: { earningAmount: order.deliveryFee },
    });

    const booked = await this.deliveryIntegration.requestCourier({
      id: order.id,
      orderNumber: order.orderNumber,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      restaurant: { name: restaurant.name, address: restaurant.address, phone: restaurant.phone },
      customer: { name: order.customer?.name ?? 'Customer', phone: order.customer?.phone ?? null },
      items: (order.items ?? []).map((i: any) => ({ quantity: i.quantity, name: i.menuItem?.name ?? 'Item' })),
    });
    if (booked) return;

    if (restaurant.latitude == null || restaurant.longitude == null) return;

    const candidates = await this.prisma.deliveryPerson.findMany({
      where: {
        isActive: true,
        isAvailable: true,
        currentLatitude: { not: null },
        currentLongitude: { not: null },
        OR: [{ tenantId: restaurant.tenantId }, { tenantId: null }],
      },
    });

    const NEARBY_RADIUS_KM = 5;
    const nearbyRiders = candidates.filter(
      (d) => haversineDistanceKm(restaurant.latitude!, restaurant.longitude!, d.currentLatitude!, d.currentLongitude!) <= NEARBY_RADIUS_KM,
    );

    for (const rider of nearbyRiders) {
      await this.notificationService.send({
        tenantId: restaurant.tenantId,
        channel: 'SMS',
        recipient: rider.phone,
        subject: 'New delivery available',
        body: `A new delivery is ready near ${restaurant.name}. Open the app to accept.`,
      });
    }
  }

  async rejectRider(tenantId: string, restaurantId: string, orderId: string) {
    const order = await this.findOneForRestaurant(tenantId, restaurantId, orderId);
    if (order.status !== 'READY' || order.delivery?.status !== 'ASSIGNED') {
      throw new BadRequestException('There is no rider waiting for approval on this order');
    }

    return this.prisma.delivery.update({
      where: { orderId },
      data: { status: 'UNASSIGNED', deliveryPersonId: null, assignedAt: null },
    });
  }

  async switchToOwnDelivery(tenantId: string, restaurantId: string, orderId: string, changedBy: string) {
    const order = await this.findOneForRestaurant(tenantId, restaurantId, orderId);
    if (TERMINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(`Order is already ${order.status}, delivery cannot be changed`);
    }
    const blocked = ownDeliveryBlockedReason(order);
    if (blocked) throw new BadRequestException(blocked);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.delivery.deleteMany({ where: { orderId, deliveryPersonId: null, provider: null } });
      const result = await tx.order.update({ where: { id: orderId }, data: { deliveryHandledBy: 'SELF_DELIVERY' } });
      await tx.orderStatusHistory.create({
        data: { orderId, status: order.status, note: "Switched to the restaurant's own riders", changedBy },
      });
      return result;
    });

    await this.activityLog.log({
      tenantId,
      restaurantId,
      actorType: 'OWNER',
      actorId: changedBy,
      action: 'ORDER_DELIVERY_CHANGED',
      description: `Order ${order.orderNumber} switched to the restaurant's own riders`,
      metadata: { orderId },
    });

    return { success: true, data: updated };
  }

  /**
   * cancel()
   * ---------
   * Customer आफैंले cancel गर्दा restaurant.cancellationWindowMinutes भित्र
   * र order अझै PENDING/ACCEPTED हुँदा मात्र अनुमति दिन्छ। Restaurant owner
   * ले जुनसुकै बेला (terminal state नभएसम्म) cancel गर्न सक्छ।
   */
  async cancel(
    actor: 'CUSTOMER' | 'RESTAURANT',
    requesterId: string,
    orderId: string,
    dto: CancelOrderDto,
    scope?: { tenantId: string; restaurantId: string },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (scope && (order.tenantId !== scope.tenantId || order.restaurantId !== scope.restaurantId)) {
      throw new NotFoundException('Order not found');
    }

    if (TERMINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(`Order is already ${order.status}, it cannot be cancelled`);
    }

    if (actor === 'CUSTOMER') {
      if (order.customerId !== requesterId) throw new NotFoundException('Order not found');

      if (!CANCELLABLE_STATUSES.includes(order.status)) {
        throw new ForbiddenException('This order is already being prepared and can no longer be cancelled by you. Please contact the restaurant.');
      }

      const restaurant = await this.prisma.restaurant.findUnique({ where: { id: order.restaurantId } });
      const windowMinutes = restaurant?.cancellationWindowMinutes ?? 5;
      const minutesSinceOrder = (Date.now() - order.createdAt.getTime()) / 60000;
      if (minutesSinceOrder > windowMinutes) {
        throw new ForbiddenException(
          `The ${windowMinutes}-minute cancellation window has passed. Please contact the restaurant directly.`,
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledBy: actor,
          cancellationReason: dto.reason,
          cancelledAt: new Date(),
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId, status: 'CANCELLED', note: dto.reason ?? 'Order cancelled', changedBy: requesterId },
      });

      return result;
    });

    await this.activityLog.log({
      tenantId: order.tenantId,
      restaurantId: order.restaurantId,
      actorType: actor === 'CUSTOMER' ? 'CUSTOMER' : 'OWNER',
      actorId: requesterId,
      action: 'ORDER_CANCELLED',
      description: `Order ${order.orderNumber} cancelled by ${actor}${dto.reason ? `: ${dto.reason}` : ''}`,
      metadata: { orderId },
    });

    return { success: true, message: 'Order cancelled successfully', data: updated };
  }


    /** 🆕 Fetch only unprinted, non-cancelled orders for auto-print polling */
  async findUnprintedForRestaurant(tenantId: string, restaurantId: string) {
    return this.prisma.order.findMany({
      where: { 
        tenantId, 
        restaurantId, 
        printedAt: null, 
        status: { not: 'CANCELLED' } // Don't auto-print cancelled orders
      },
      orderBy: { createdAt: 'asc' }, // Process oldest first
      include: { 
        items: { include: { menuItem: true } }, 
        customer: { select: { name: true, phone: true } } 
      },
    });
  }

  /** 🆕 Mark an order as printed */
  async markAsPrinted(tenantId: string, restaurantId: string, orderId: string) {
    return this.prisma.order.update({
      where: { id: orderId, tenantId, restaurantId },
      data: { printedAt: new Date() },
    });
  }

  
  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `ORD-${year}-${random}`;
  }

    /**
   * markOrderAsPaid
   * Safely updates paymentStatus to PAID. 
   * Used exclusively by payment webhooks to confirm successful online payments.
   */
  async markOrderAsPaid(orderId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'PAID' },
    });
  }
}