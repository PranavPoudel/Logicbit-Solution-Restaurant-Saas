import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto, ReorderBannersDto, UpdateStorefrontConfigDto, CreatePopupDto, UpdatePopupDto } from './dto/storefront.dto';

@Injectable()
export class StorefrontService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Banners (Owner-facing) ----------

  async createBanner(tenantId: string, restaurantId: string, dto: CreateBannerDto) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.storefrontBanner.create({ data: { ...dto, tenantId, restaurantId } });
  }

  async findAllBanners(tenantId: string, restaurantId: string) {
    return this.prisma.storefrontBanner.findMany({
      where: { tenantId, restaurantId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateBanner(tenantId: string, restaurantId: string, id: string, dto: UpdateBannerDto) {
    const banner = await this.prisma.storefrontBanner.findFirst({ where: { id, tenantId, restaurantId } });
    if (!banner) throw new NotFoundException('Banner not found');

    return this.prisma.storefrontBanner.update({ where: { id }, data: dto });
  }

  async removeBanner(tenantId: string, restaurantId: string, id: string) {
    const banner = await this.prisma.storefrontBanner.findFirst({ where: { id, tenantId, restaurantId } });
    if (!banner) throw new NotFoundException('Banner not found');

    await this.prisma.storefrontBanner.delete({ where: { id } });
    return { message: 'Banner deleted successfully' };
  }

  /**
   * reorderBanners()
   * ------------------
   * Drag-and-drop UI ले नयाँ क्रममा भएका banner ID हरूको array पठाउँछ।
   * यहाँ हरेक ID लाई त्यही array भित्रको index लाई displayOrder बनाइदिन्छौं।
   * Transaction प्रयोग गरिएको छ ताकि आधा मात्र update भएर क्रम बिग्रिने
   * अवस्था नआओस्।
   */
  async reorderBanners(tenantId: string, restaurantId: string, dto: ReorderBannersDto) {
    const existingBanners = await this.prisma.storefrontBanner.findMany({ where: { tenantId, restaurantId } });
    const existingIds = new Set(existingBanners.map((b) => b.id));

    for (const id of dto.orderedBannerIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Banner ${id} does not belong to this restaurant`);
      }
    }

    await this.prisma.$transaction(
      dto.orderedBannerIds.map((id, index) =>
        this.prisma.storefrontBanner.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );

    return this.findAllBanners(tenantId, restaurantId);
  }

  // ---------- Config (About/Contact/Section order) ----------

  async getConfig(tenantId: string, restaurantId: string) {
    let config = await this.prisma.storefrontConfig.findFirst({ where: { tenantId, restaurantId } });
    if (!config) {
      // पहिलो पटक हो भने default config auto-बनाइदिने, owner लाई manually "create" गर्नु नपरोस्
      config = await this.prisma.storefrontConfig.create({ data: { tenantId, restaurantId } });
    }
    return config;
  }

  async updateConfig(tenantId: string, restaurantId: string, dto: UpdateStorefrontConfigDto) {
    await this.getConfig(tenantId, restaurantId); // existence ensure गर्ने (auto-create भइहाल्छ)

    return this.prisma.storefrontConfig.update({
      where: { restaurantId },
      data: { ...dto, sectionOrder: dto.sectionOrder ?? undefined },
    });
  }

  // ---------- Popup (Offer/Notification) ----------

  async createPopup(tenantId: string, restaurantId: string, dto: CreatePopupDto) {
    return this.prisma.storefrontPopup.create({
      data: {
        tenantId,
        restaurantId,
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async findAllPopups(tenantId: string, restaurantId: string) {
    return this.prisma.storefrontPopup.findMany({ where: { tenantId, restaurantId }, orderBy: { createdAt: 'desc' } });
  }

  async updatePopup(tenantId: string, restaurantId: string, id: string, dto: UpdatePopupDto) {
    const popup = await this.prisma.storefrontPopup.findFirst({ where: { id, tenantId, restaurantId } });
    if (!popup) throw new NotFoundException('Popup not found');

    return this.prisma.storefrontPopup.update({
      where: { id },
      data: { ...dto, startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined },
    });
  }

  async removePopup(tenantId: string, restaurantId: string, id: string) {
    const popup = await this.prisma.storefrontPopup.findFirst({ where: { id, tenantId, restaurantId } });
    if (!popup) throw new NotFoundException('Popup not found');

    await this.prisma.storefrontPopup.delete({ where: { id } });
    return { message: 'Popup deleted successfully' };
  }

  /** PUBLIC — website खोल्ने बित्तिकै देखाउने active+schedule-भित्रको popup */
  async getActivePopup(restaurantId: string) {
    const now = new Date();
    const popup = await this.prisma.storefrontPopup.findFirst({
      where: {
        restaurantId,
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: popup };
  }

  // ---------- Public (Customer-facing website) ----------

  /**
   * getPublicStorefront()
   * -----------------------
   * Customer-facing homepage ले यही एउटा call बाट banner, about/contact,
   * र section order — सबै एकैचोटि पाउँछ। Menu छुट्टै (Discovery module को
   * findPublicMenu) बाट आउँछ, किनभने त्यो ठूलो/अलग data हो।
   */
  async getPublicStorefront(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, isActive: true } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const [banners, config] = await Promise.all([
      this.prisma.storefrontBanner.findMany({
        where: { restaurantId, isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.storefrontConfig.findFirst({ where: { restaurantId } }),
    ]);

    return {
      success: true,
      data: {
        banners,
        about: config?.aboutText ?? null,
        contact: {
          phone: config?.contactPhone ?? restaurant.address,
          email: config?.contactEmail ?? null,
          address: config?.contactAddress ?? restaurant.address,
        },
        socialLinks: config?.socialLinks ?? {},
        sectionOrder: config?.sectionOrder ?? ['banner', 'offers', 'menu', 'about', 'contact'],
      },
    };
  }
}
