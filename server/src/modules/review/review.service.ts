import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * create()
   * ---------
   * Gap-fix: Review जोसुकैले जे पायो त्यही दिन नपाओस् भनेर, यदि orderId
   * दिइएको छ भने त्यो order:
   *   1. यही customer को हो
   *   2. यही restaurant को हो
   *   3. DELIVERED वा COMPLETED भइसकेको छ (अझै preparing हुँदै review दिन मिल्दैन)
   *   4. पहिले नै review नभएको (एउटा order मा एक पटक मात्र review — Order.review @unique ले पनि DB level मा यो्लाई enforce गर्छ)
   * यसले "fake/unverified review" समस्या हल गर्छ, WooCommerce/Amazon को
   * "Verified Purchase" जस्तै व्यवहार दिन्छ।
   */
  async create(customerId: string, dto: CreateReviewDto) {
    if (dto.orderId) {
      const order = await this.prisma.order.findFirst({ where: { id: dto.orderId, customerId, restaurantId: dto.restaurantId } });
      if (!order) throw new NotFoundException('Order not found for this restaurant');
      if (!['DELIVERED', 'COMPLETED'].includes(order.status)) {
        throw new BadRequestException('You can only review an order after it has been delivered/completed');
      }

      const existingReview = await this.prisma.review.findUnique({ where: { orderId: dto.orderId } });
      if (existingReview) throw new ConflictException('You have already reviewed this order');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          restaurantId: dto.restaurantId,
          customerId,
          orderId: dto.orderId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      // Restaurant को avgRating/totalReviews aggregate update — running average
      const stats = await tx.review.aggregate({
        where: { restaurantId: dto.restaurantId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await tx.restaurant.update({
        where: { id: dto.restaurantId },
        data: { avgRating: stats._avg.rating ?? 0, totalReviews: stats._count.rating },
      });

      return created;
    });

    return { success: true, message: 'Review submitted successfully', data: review };
  }

  async findAllForRestaurant(restaurantId: string) {
    return this.prisma.review.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true } } },
    });
  }
}
