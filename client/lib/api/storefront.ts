// lib/api/storefront.ts
import { ownerApiClient } from "@/lib/api/owner-client";

export interface BannerInput {
  imageUrl: string;
  title?: string;
  subtitle?: string; 
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean; 
  [key: string]: unknown;
}


export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface StorefrontPopup {
  id: string;
  title: string;
  message?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  type: PopupType;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export const storefrontBannersApi = {
  create: async (restaurantId: string, input: BannerInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/storefront/banners`, input)).data,
  list: async (restaurantId: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/storefront/banners`)).data,
  update: async (restaurantId: string, id: string, input: Partial<BannerInput>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/storefront/banners/${id}`, input)).data,
  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/storefront/banners/${id}`)).data,
  reorder: async (restaurantId: string, orderedBannerIds: string[]) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/storefront/banners/reorder`, { orderedBannerIds })).data,
};

export interface SectionSetting {
  id: string;
  isVisible: boolean;
  titleEn: string;
  titleJa: string;
}

export interface StorefrontConfigInput {
  aboutText?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks?: Record<string, string>;
  sectionSettings?: SectionSetting[]; // 🆕 Upgraded type
}

export const storefrontConfigApi = {
  get: async (restaurantId: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/storefront/config`)).data,
  update: async (restaurantId: string, input: StorefrontConfigInput) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/storefront/config`, input)).data,
};

export type PopupType = "DISCOUNT" | "NEW_DISH" | "EVENT" | "ANNOUNCEMENT" | "EXTERNAL_AD";

export const POPUP_TYPES: { value: PopupType; label: string }[] = [
  { value: "DISCOUNT", label: "Discount" },
  { value: "NEW_DISH", label: "New dish" },
  { value: "EVENT", label: "Event" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "EXTERNAL_AD", label: "External ad" },
];

export const POPUP_LIMITS = { own: 3, external: 1 };

export interface StorefrontPopupInput {
  title: string;
  message?: string;        
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  type?: PopupType;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export const storefrontPopupsApi = {
  create: async (restaurantId: string, input: StorefrontPopupInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/storefront/popups`, input)).data,
  list: async (restaurantId: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/storefront/popups`)).data,
  update: async (restaurantId: string, id: string, input: Partial<StorefrontPopupInput>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/storefront/popups/${id}`, input)).data,
  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/storefront/popups/${id}`)).data,
};