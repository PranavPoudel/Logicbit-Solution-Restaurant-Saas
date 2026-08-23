import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * generateForRestaurant()
   * -------------------------
   * Platform Admin ले periodic (साप्ताहिक/मासिक) रूपमा चलाउने function —
   * दिइएको अवधिभित्र भएका सबै DELIVERED/COMPLETED COD order जम्मा गरेर
   * "यति commission तिर्नुपर्छ" भन्ने Settlement record (invoice) बनाउँछ।
   *
   * यो केवल COD order मा मात्र चाहिन्छ — Online payment (भविष्यमा) भएको
   * order मा commission payment gateway बाटै automatically deduct हुन
   * सक्छ, त्यसैले त्यसमा छुट्टै settlement चाहिँदैन।
   */
  async generateForRestaurant(restaurantId: string, periodStart: string, periodEnd: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        paymentMethod: 'COD',
        status: { in: ['DELIVERED', 'COMPLETED'] },
        createdAt: { gte: start, lte: end },
      },
    });

    const totalCodAmount = orders.reduce((sum, o) => sum + o.total, 0);
    const commissionDue = orders.reduce((sum, o) => sum + o.platformCommissionAmount, 0);

    const settlement = await this.prisma.settlement.create({
      data: {
        tenantId: restaurant.tenantId,
        restaurantId,
        periodStart: start,
        periodEnd: end,
        totalOrders: orders.length,
        totalCodAmount,
        commissionDue,
        status: 'PENDING',
      },
    });

    return { success: true, data: settlement };
  }

  /** Platform Admin — सबै tenant भरिका pending settlement हेर्ने (कसले तिरेको छैन भनेर) */
  async listPending() {
    return this.prisma.settlement.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsPaid(id: string, paymentReference?: string) {
    const settlement = await this.prisma.settlement.findUnique({ where: { id } });
    if (!settlement) throw new NotFoundException('Settlement not found');

    return this.prisma.settlement.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date(), paymentReference },
    });
  }

  /** Restaurant Owner — आफूले कति commission तिर्नुपर्छ भनेर पारदर्शी रूपमा हेर्ने (transparency fix) */
  async findAllForRestaurant(tenantId: string, restaurantId: string) {
    return this.prisma.settlement.findMany({
      where: { tenantId, restaurantId },
      orderBy: { periodStart: 'desc' },
    });
  }

  /** Restaurant Owner Dashboard — "अहिलेसम्म कति बाँकी छ" भन्ने summary */
  async getOutstandingSummary(tenantId: string, restaurantId: string) {
    const outstanding = await this.prisma.settlement.aggregate({
      where: { tenantId, restaurantId, status: { in: ['PENDING', 'OVERDUE'] } },
      _sum: { commissionDue: true },
      _count: { id: true },
    });

    return {
      success: true,
      data: {
        outstandingSettlements: outstanding._count.id,
        totalCommissionOwed: outstanding._sum.commissionDue ?? 0,
      },
    };
  }
}
