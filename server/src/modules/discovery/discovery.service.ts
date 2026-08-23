import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { calculateRankingScore } from '../../common/utils/ranking.util';
import { TranslationService } from '../translation/translation.service';
import { AdvertisementService } from '../advertisement/advertisement.service';

import { calculateDeliveryQuote } from '../../common/utils/delivery-fee.util';

@Injectable()
export class DiscoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly translation: TranslationService,
    private readonly advertisementService: AdvertisementService,
  ) {}

  /**
   * findNearby()
   * -------------
   * PUBLIC (JWT-less) — customer ले login नगरी नजिकको restaurant भेट्टाउन
   * यही endpoint प्रयोग गर्छ।
   *
   * SECURITY: सबै filter value यहाँ `Prisma.sql` tagged template मार्फत
   * पठाइन्छ, कहिल्यै string concatenation मार्फत होइन — Prisma ले tagged
   * template भित्रका value लाई automatically parameterize (prepared
   * statement) गर्छ, जसले SQL Injection सम्पूर्ण रूपमा रोक्छ।
   */
  async findNearby(query: NearbyQueryDto) {
    const { lat, lng, radiusKm = 5, cuisineType, minRating, priceRange, isOpenNow, sortBy = 'recommended', page = 1, limit = 20 } = query;

    const distanceExpr = Prisma.sql`
      (
        6371 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(${lat})) * cos(radians("latitude")) *
            cos(radians("longitude") - radians(${lng})) +
            sin(radians(${lat})) * sin(radians("latitude"))
          ))
        )
      )
    `;

    const conditions: Prisma.Sql[] = [
      Prisma.sql`"isActive" = true`,
      Prisma.sql`"latitude" IS NOT NULL`,
      Prisma.sql`"longitude" IS NOT NULL`,
    ];
    if (minRating !== undefined) conditions.push(Prisma.sql`"avgRating" >= ${minRating}`);
    if (priceRange) conditions.push(Prisma.sql`"priceRange" = ${priceRange}`);
    if (isOpenNow) conditions.push(Prisma.sql`"isOpen" = true`);
    if (cuisineType) {
      // GAP FIX: पहिले `cuisineTypes` free-text array column थियो, अब
      // managed Cuisine relation प्रयोग हुन्छ — cuisine को slug ले filter गर्ने।
      conditions.push(
        Prisma.sql`"id" IN (
          SELECT rc."restaurantId" FROM "RestaurantCuisine" rc
          JOIN "Cuisine" c ON c.id = rc."cuisineId"
          WHERE c.slug = ${cuisineType} AND c."isActive" = true
        )`,
      );
    }

    const whereClause = Prisma.join(conditions, ' AND ');
    const offset = (page - 1) * limit;

    const rows: any[] = await this.prisma.$queryRaw`
      SELECT *, ${distanceExpr} AS "distanceKm"
      FROM "Restaurant"
      WHERE ${whereClause}
        AND ${distanceExpr} <= ${radiusKm}
      ORDER BY "distanceKm" ASC
      LIMIT 200;
    `;

    const maxOrdersInArea = Math.max(1, ...rows.map((r) => r.totalOrders ?? 0));
    const sponsoredIds = await this.advertisementService.getSearchBoostedRestaurantIds();

    // Sponsored (SEARCH_BOOST ad किनेका) restaurant लाई ranking score मा
    // थप weight दिइन्छ — तर distance/rating लाई पूर्ण रूपमा override गर्दैन,
    // "पैसा तिरे जतिसुकै टाढा भए पनि सधैं १ नम्बरमा" जस्तो नराम्रो customer
    // experience नहोस् भनेर एउटा bounded bonus (+0.15) मात्र थपिन्छ।
    const SPONSORED_BOOST = 0.15;

    const ranked = rows
      .map((r) => {
        const isSponsored = sponsoredIds.has(r.id);
        const baseScore = calculateRankingScore({
          distanceKm: r.distanceKm,
          searchRadiusKm: radiusKm,
          avgRating: r.avgRating ?? 0,
          totalOrders: r.totalOrders ?? 0,
          maxOrdersInArea,
        });
        return {
          ...r,
          distanceKm: Number(r.distanceKm.toFixed(2)),
          isSponsored,
          score: isSponsored ? baseScore + SPONSORED_BOOST : baseScore,
        };
      })
      .sort((a, b) => {
        // Sponsored restaurant सधैं आफ्नो group भित्र माथि रहन्छन् (सबैभन्दा
        // पहिले sortBy जे भए पनि); त्यसपछि customer ले छानेको sort अनुसार।
        if (a.isSponsored !== b.isSponsored) return a.isSponsored ? -1 : 1;

        if (sortBy === 'rating') return (b.avgRating ?? 0) - (a.avgRating ?? 0);
        if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
        return b.score - a.score; // 'recommended' — ranking algorithm (default)
      });

    const paginated = ranked.slice(offset, offset + limit);

    // Raw SQL बाट आएको result मा cuisine names हुँदैन (त्यो अर्कै table मा
    // छ) — यहाँ separate query ले fetch गरेर merge गरिन्छ।
    const restaurantIds = paginated.map((r) => r.id);
    const cuisineLinks = await this.prisma.restaurantCuisine.findMany({
      where: { restaurantId: { in: restaurantIds } },
      include: { cuisine: { select: { name: true, slug: true } } },
    });
    const cuisineMap = new Map<string, { name: string; slug: string }[]>();
    for (const link of cuisineLinks) {
      const list = cuisineMap.get(link.restaurantId) ?? [];
      list.push(link.cuisine);
      cuisineMap.set(link.restaurantId, list);
    }

    return {
      success: true,
      data: {
        restaurants: paginated.map((r) => this.toPublicRestaurantShape(r, cuisineMap.get(r.id) ?? [])),
        pagination: { page, limit, total: ranked.length },
      },
    };
  }

  /** एउटा restaurant को public profile (customer-facing) */
  async findPublicOne(idOrSlug: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const cuisines = await this.prisma.restaurantCuisine.findMany({
      where: { restaurantId: restaurant.id },
      include: { cuisine: { select: { name: true, slug: true } } },
    });

    return { success: true, data: this.toPublicRestaurantShape(restaurant, cuisines.map((c) => c.cuisine)) };
  }

  /** PUBLIC menu view — customer ले login नगरी menu हेर्न पाउने, ?lang= दिए auto-translate हुने */
  async findPublicMenu(restaurantId: string, lang?: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, isActive: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const categories = await this.prisma.category.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        menuItems: {
          where: { deletedAt: null, isAvailable: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    const translatedCategories =
      lang && lang !== restaurant.locale
        ? await Promise.all(
            categories.map(async (cat) => ({
              ...cat,
              name: await this.translation.translate(cat.name, lang),
              description: cat.description ? await this.translation.translate(cat.description, lang) : cat.description,
              menuItems: await Promise.all(
                cat.menuItems.map(async (item) => ({
                  ...item,
                  name: await this.translation.translate(item.name, lang),
                  description: item.description ? await this.translation.translate(item.description, lang) : item.description,
                })),
              ),
            })),
          )
        : categories;

    return { success: true, data: { restaurant: this.toPublicRestaurantShape(restaurant, await this.getCuisineNames(restaurantId)), categories: translatedCategories } };
  }

  private async getCuisineNames(restaurantId: string) {
    const links = await this.prisma.restaurantCuisine.findMany({
      where: { restaurantId },
      include: { cuisine: { select: { name: true, slug: true } } },
    });
    return links.map((l) => l.cuisine);
  }

  /** PUBLIC — एउटा menu item को पूरा detail, उपलब्ध ModifierGroup+Option सहित */
  async findPublicMenuItemDetail(restaurantId: string, menuItemId: string) {
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurantId, deletedAt: null, isAvailable: true },
      include: {
        category: { select: { id: true, name: true } },
        modifierGroups: {
          include: { modifierGroup: { include: { options: { where: { isAvailable: true }, orderBy: { displayOrder: 'asc' } } } } },
        },
      },
    });
    if (!menuItem) throw new NotFoundException('Menu item not found');

    return {
      success: true,
      data: {
        ...menuItem,
        modifierGroups: menuItem.modifierGroups.map((link) => link.modifierGroup),
      },
    };
  }

  /**
   * searchMenu()
   * -------------
   * PUBLIC — customer ले "momo" जस्तो टाइप गरेर menu item खोज्ने। अहिले
   * simple `contains` (case-insensitive) match प्रयोग गरिएको छ। Fuzzy/
   * typo-tolerant search (pg_trgm) भविष्यमा थप्न सकिन्छ — डिजाइन document
   * मा योजना नै छ, अहिले scale को हिसाबले यो पर्याप्त छ।
   */
  async searchMenu(restaurantId: string, query: string) {
    if (!query || query.trim().length === 0) return { success: true, data: [] };

    const items = await this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        deletedAt: null,
        isAvailable: true,
        name: { contains: query, mode: 'insensitive' },
      },
      include: { category: { select: { id: true, name: true } } },
      take: 30,
    });

    return { success: true, data: items };
  }

  /** PUBLIC — Homepage "Popular Items" section को लागि (owner ले manually feature गरेका item) */
  async getFeaturedItems(restaurantId: string) {
    const items = await this.prisma.menuItem.findMany({
      where: { restaurantId, deletedAt: null, isAvailable: true, isFeatured: true },
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, data: items };
  }

  /** PUBLIC — Homepage "Popular Category" section को लागि */
  async getFeaturedCategories(restaurantId: string) {
    const categories = await this.prisma.category.findMany({
      where: { restaurantId, isActive: true, isFeatured: true },
      orderBy: { displayOrder: 'asc' },
    });
    return { success: true, data: categories };
  }

  /**
   * checkDeliveryAvailability()
   * -----------------------------
   * GAP FIX: Frontend ले checkout अघि नै "यो customer को location मा
   * यो restaurant ले deliver गर्छ कि गर्दैन, र fee कति पर्छ" भनेर सोध्ने
   * ठाउँ नै थिएन — customer ले cart भरिसकेपछि मात्र checkout बेला थाहा
   * पाउँथे। अब यो PUBLIC endpoint ले checkout अघि नै Yes/No + estimated
   * fee देखाउन मिल्छ (checkout को logic सँग उही function प्रयोग गरेर,
   * ताकि दुई ठाउँमा फरक जवाफ नआओस्)।
   */
  async checkDeliveryAvailability(restaurantId: string, lat: number, lng: number) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, isActive: true } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    if (restaurant.latitude == null || restaurant.longitude == null) {
      return { success: true, data: { deliverable: false, reason: 'Restaurant location not configured yet' } };
    }

    const quote = calculateDeliveryQuote({
      restaurantLat: restaurant.latitude,
      restaurantLng: restaurant.longitude,
      customerLat: lat,
      customerLng: lng,
      selfDeliveryRadiusKm: restaurant.selfDeliveryRadiusKm,
      maxDeliveryRadiusKm: restaurant.maxDeliveryRadiusKm,
      selfDeliveryFeeType: restaurant.selfDeliveryFeeType as any,
      selfDeliveryFlatFee: restaurant.selfDeliveryFlatFee,
      selfDeliveryPerKmFee: restaurant.selfDeliveryPerKmFee,
      thirdPartyFeeType: restaurant.thirdPartyFeeType as any,
      thirdPartyBaseFee: restaurant.thirdPartyBaseFee,
      thirdPartyPerKmFee: restaurant.thirdPartyPerKmFee,
    });

    return { success: true, data: quote };
  }

  private toPublicRestaurantShape(r: any, cuisines: { name: string; slug: string }[] = []) {
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      cuisines,
      avgRating: r.avgRating,
      priceRange: r.priceRange,
      distanceKm: r.distanceKm,
      isOpen: r.isOpen,
      isSponsored: r.isSponsored ?? false,
      logoUrl: r.logoUrl,
      coverImageUrl: r.coverImageUrl,
      address: r.address,
      city: r.city,
      currencyCode: r.currencyCode,
    };
  }
}
