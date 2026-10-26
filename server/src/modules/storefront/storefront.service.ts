// src/modules/storefront/storefront.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PopupType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto, ReorderBannersDto, UpdateStorefrontConfigDto, CreatePopupDto, UpdatePopupDto } from './dto/storefront.dto';

const OWN_POPUP_LIMIT = 3;
const EXTERNAL_POPUP_LIMIT = 1;

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

  // ---------- Config (About/Contact/Section Settings) ----------

  async getConfig(tenantId: string, restaurantId: string) {
    const config = await this.prisma.storefrontConfig.upsert({
      where: { restaurantId },
      update: {},
      create: {
        tenantId,
        restaurantId,
        sectionSettings: [], // 🆕 Default empty array, frontend will populate with defaults
      },
    });
    return config;
  }

  async updateConfig(tenantId: string, restaurantId: string, dto: UpdateStorefrontConfigDto) {
    await this.getConfig(tenantId, restaurantId);

    return this.prisma.storefrontConfig.update({
      where: { restaurantId },
      data: { 
        ...dto, 
        sectionSettings: dto.sectionSettings ?? undefined // 🆕 Updated to sectionSettings
      },
    });
  }

  // ---------- Popup (Offer/Notification) ----------

  private async assertPopupLimit(tenantId: string, restaurantId: string, type: PopupType, excludeId?: string) {
    const isExternal = type === PopupType.EXTERNAL_AD;
    const limit = isExternal ? EXTERNAL_POPUP_LIMIT : OWN_POPUP_LIMIT;
    const active = await this.prisma.storefrontPopup.count({
      where: {
        tenantId,
        restaurantId,
        isActive: true,
        type: isExternal ? PopupType.EXTERNAL_AD : { not: PopupType.EXTERNAL_AD },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (active >= limit) {
      const kind = isExternal ? 'external ad' : 'promotional popups';
      throw new BadRequestException(`Limit reached: only ${limit} active ${kind} allowed. Turn one off to activate another.`);
    }
  }

  async createPopup(tenantId: string, restaurantId: string, dto: CreatePopupDto) {
    if (dto.isActive ?? true) await this.assertPopupLimit(tenantId, restaurantId, dto.type ?? PopupType.ANNOUNCEMENT);
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
    if (dto.isActive ?? popup.isActive) await this.assertPopupLimit(tenantId, restaurantId, dto.type ?? popup.type, id);

    return this.prisma.storefrontPopup.update({
      where: { id },
      data: { 
        ...dto, 
        startDate: dto.startDate ? new Date(dto.startDate) : undefined, 
        endDate: dto.endDate ? new Date(dto.endDate) : undefined 
      },
    });
  }

  async removePopup(tenantId: string, restaurantId: string, id: string) {
    const popup = await this.prisma.storefrontPopup.findFirst({ where: { id, tenantId, restaurantId } });
    if (!popup) throw new NotFoundException('Popup not found');

    await this.prisma.storefrontPopup.delete({ where: { id } });
    return { message: 'Popup deleted successfully' };
  }

  async getActivePopup(restaurantId: string) {
    const now = new Date();
    const popups = await this.prisma.storefrontPopup.findMany({
      where: {
        restaurantId,
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
    });
    const popup = popups.length > 0 ? popups[Math.floor(Math.random() * popups.length)] : null;
    return { success: true, data: popup };
  }

  // ---------- Public (Customer-facing website) ----------

  async getPublicStorefront(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, isActive: true } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const now = new Date();
    const [banners, config, coupons] = await Promise.all([
      this.prisma.storefrontBanner.findMany({
        where: { restaurantId, isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      this.prisma.storefrontConfig.findFirst({ where: { restaurantId } }),
      this.prisma.coupon.findMany({
        where: {
          tenantId: restaurant.tenantId,
          OR: [{ restaurantId }, { restaurantId: null }],
          isActive: true,
          deletedAt: null,
          validFrom: { lte: now },
          AND: [{ OR: [{ validUntil: null }, { validUntil: { gt: now } }] }],
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const offers = coupons
      .filter((c) => c.usageLimit === null || c.usedCount < c.usageLimit)
      .map((c) => ({
        id: c.id,
        code: c.isAutoApply ? null : c.code,
        type: c.type,
        value: c.value,
        maxDiscount: c.maxDiscount,
        minOrderAmount: c.minOrderAmount,
        validUntil: c.validUntil,
      }));

    return {
      success: true,
      data: {
        banners,
        offers,
        about: config?.aboutText ?? null,
        contact: {
          phone: config?.contactPhone ?? restaurant.address,
          email: config?.contactEmail ?? null,
          address: config?.contactAddress ?? restaurant.address,
        },
        socialLinks: config?.socialLinks ?? {},
        sectionSettings: config?.sectionSettings ?? [], // 🆕 Updated to sectionSettings
      },
    };
  }
}