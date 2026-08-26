// lib/api/storefront.ts — Module 14: Storefront Builder (Owner)
import { ownerApiClient } from "@/lib/api/owner-client";

// Field names confirmed against server CreateBannerDto/UpdateBannerDto.
export interface BannerInput {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface Banner extends BannerInput {
  id: string;
  restaurantId: string;
}

export const storefrontBannersApi = {
  create: async (restaurantId: string, input: BannerInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/storefront/banners`, input)).data,
  list: async (restaurantId: string): Promise<Banner[]> =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/storefront/banners`)).data,
  update: async (restaurantId: string, id: string, input: Partial<BannerInput>) =>
    (
      await ownerApiClient.patch(
        `/restaurants/${restaurantId}/storefront/banners/${id}`,
        input
      )
    ).data,
  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/storefront/banners/${id}`)).data,
  // Server expects the key "orderedBannerIds" (see ReorderBannersDto), not "orderedIds".
  reorder: async (restaurantId: string, orderedBannerIds: string[]) =>
    (
      await ownerApiClient.patch(
        `/restaurants/${restaurantId}/storefront/banners/reorder`,
        { orderedBannerIds }
      )
    ).data,
};

// Field names confirmed against server UpdateStorefrontConfigDto.
export interface StorefrontConfigInput {
  aboutText?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks?: Record<string, string>;
  sectionOrder?: string[];
}

export interface StorefrontConfig extends StorefrontConfigInput {
  id: string;
  restaurantId: string;
}

export const storefrontConfigApi = {
  get: async (restaurantId: string): Promise<StorefrontConfig> =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/storefront/config`)).data,
  update: async (restaurantId: string, input: StorefrontConfigInput) =>
    (
      await ownerApiClient.patch(`/restaurants/${restaurantId}/storefront/config`, input)
    ).data,
};

// Field names confirmed against server CreatePopupDto/UpdatePopupDto.
// The DTO uses "message", not "description".
export interface StorefrontPopupInput {
  title: string;
  message?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface StorefrontPopup extends StorefrontPopupInput {
  id: string;
  restaurantId: string;
}

export const storefrontPopupsApi = {
  create: async (restaurantId: string, input: StorefrontPopupInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/storefront/popups`, input)).data,
  list: async (restaurantId: string): Promise<StorefrontPopup[]> =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/storefront/popups`)).data,
  update: async (restaurantId: string, id: string, input: Partial<StorefrontPopupInput>) =>
    (
      await ownerApiClient.patch(
        `/restaurants/${restaurantId}/storefront/popups/${id}`,
        input
      )
    ).data,
  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/storefront/popups/${id}`)).data,
};
