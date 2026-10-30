import { apiClient } from "@/lib/api/client";
import { API_ORIGIN } from "@/lib/api-config";
import type { PopupType } from "@/lib/api/storefront";

// Helper to resolve relative image URLs from the backend

export const resolveMediaUrl = (url?: string) => {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return API_ORIGIN + url;
};

export interface PublicConfig {
  aboutText?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks?: Record<string, string>;
  sectionOrder?: string[];
}

export interface PublicBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}

type RawBanner = Omit<PublicBanner, "imageUrl"> & { imageUrl?: string; isActive?: boolean };

export interface PublicStorefrontData {
  config: PublicConfig;
  banners: PublicBanner[];
}

export interface PublicPopup {
  id: string;
  restaurantId: string;
  type?: PopupType;
  title: string;
  message?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
}

export const publicStorefrontApi = {
  getStorefront: async (restaurantId: string): Promise<PublicStorefrontData> => {
    const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/storefront`);
    
    // Safely extract and format banners
    const rawBanners = data?.banners || data || [];
    const banners = (Array.isArray(rawBanners) ? (rawBanners as RawBanner[]) : []).filter((b) => b.isActive).map((b) => ({
      ...b,
      imageUrl: resolveMediaUrl(b.imageUrl) ?? "",
    }));

    // Safely extract config
    const config = data?.config || {};

    return { config, banners };
  },

  getPopup: async (restaurantId: string): Promise<PublicPopup | null> => {
    const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/storefront/popup`);
    
    if (!data) return null;

    const now = new Date().toISOString();
    
    // Filter for active popups within their date range
    if (!data.isActive) return null;
    if (data.startDate && new Date(data.startDate) > new Date(now)) return null;
    if (data.endDate && new Date(data.endDate) < new Date(now)) return null;

    return {
      ...data,
      imageUrl: resolveMediaUrl(data.imageUrl),
    };
  },
};