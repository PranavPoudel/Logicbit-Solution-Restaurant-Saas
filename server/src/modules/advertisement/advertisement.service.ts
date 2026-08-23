import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdvertisementDto, ApproveAdvertisementDto, RejectAdvertisementDto } from './dto/advertisement.dto';

@Injectable()
export class AdvertisementService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Owner-facing ----------

  async requestAd(tenantId: string, restaurantId: string, dto: CreateAdvertisementDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) throw new BadRequestException('endDate must be after startDate');

    return this.prisma.advertisement.create({
      data: {
        tenantId,
        restaurantId,
        placementType: dto.placementType as any,
        title: dto.title,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        startDate: start,
        endDate: end,
        status: 'PENDING',
      },
    });
  }

  async findMyAds(tenantId: string, restaurantId: string) {
    return this.prisma.advertisement.findMany({ where: { tenantId, restaurantId }, orderBy: { createdAt: 'desc' } });
  }

  // ---------- Platform Admin-facing ----------

  /** Payment/business team ले confirm गरेपछि मात्र ad live हुने — owner ले आफैं activate गर्न पाउँदैनन् */
  async listPendingAds() {
    return this.prisma.advertisement.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveAd(id: string, dto: ApproveAdvertisementDto) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement request not found');

    return this.prisma.advertisement.update({
      where: { id },
      data: { status: 'ACTIVE', amountPaid: dto.amountPaid, priority: dto.priority ?? ad.priority },
    });
  }

  async rejectAd(id: string, dto: RejectAdvertisementDto) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement request not found');

    return this.prisma.advertisement.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: dto.reason },
    });
  }

  // ---------- Public (Customer-facing homepage) ----------

  private async findActiveAds(placementType: 'HOMEPAGE_BANNER' | 'SEARCH_BOOST' | 'POPUP') {
    const now = new Date();
    return this.prisma.advertisement.findMany({
      where: {
        placementType,
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { priority: 'desc' },
    });
  }

  /** PUBLIC — Homepage मा सबैले देख्ने "Sponsored Restaurants" banner */
  async getHomepageBanners() {
    const ads = await this.findActiveAds('HOMEPAGE_BANNER');
    const restaurantIds = ads.map((a) => a.restaurantId);
    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: restaurantIds }, isActive: true },
      select: { id: true, name: true, slug: true, logoUrl: true, avgRating: true, city: true },
    });
    const restaurantMap = new Map(restaurants.map((r) => [r.id, r]));

    return {
      success: true,
      data: ads
        .filter((a) => restaurantMap.has(a.restaurantId))
        .map((a) => ({
          id: a.id,
          title: a.title,
          imageUrl: a.imageUrl,
          linkUrl: a.linkUrl,
          restaurant: restaurantMap.get(a.restaurantId),
        })),
    };
  }

  /** PUBLIC — Website खोल्नेबित्तिकै platform-wide popup ad */
  async getPopupAd() {
    const ads = await this.findActiveAds('POPUP');
    return { success: true, data: ads[0] ?? null };
  }

  /**
   * getSearchBoostedRestaurantIds()
   * ---------------------------------
   * Discovery ranking algorithm ले यो call गर्छ — कुन restaurant हरूले
   * "SEARCH_BOOST" ad किनेका छन् भनेर पत्ता लगाउन, ताकि near-me नतिजामा
   * "Sponsored" tag सहित माथि देखाउन सकियोस्।
   */
  async getSearchBoostedRestaurantIds(): Promise<Set<string>> {
    const ads = await this.findActiveAds('SEARCH_BOOST');
    return new Set(ads.map((a) => a.restaurantId));
  }
}
