// lib/api/public-storefront.ts
import { apiClient } from "@/lib/api/client"; // Your standard customer API client

// Helper to resolve relative image URLs from the backend
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3700";
export const resolveMediaUrl = (url?: string) => {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return API_ORIGIN + url;
};

export interface PublicBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
}

export interface PublicConfig {
  aboutText?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks?: Record<string, string>;
}

export interface PublicPopup {
  id: string;
  title: string;
  message?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
}

// ⚠️ Senior Check: Ensure these endpoints are PUBLIC in your backend (no JwtAuthGuard).
// If your backend scopes them differently, adjust the URL paths below.
export const publicStorefrontApi = {
  getBanners: async (restaurantId: string): Promise<PublicBanner[]> => {
    const { data } = await apiClient.get(`/restaurants/${restaurantId}/storefront/banners`);
    // Filter only active banners and resolve image URLs
    return (data || []).filter((b: any) => b.isActive).map((b: any) => ({
      ...b,
      imageUrl: resolveMediaUrl(b.imageUrl),
    }));
  },

  getConfig: async (restaurantId: string): Promise<PublicConfig> => {
    const { data } = await apiClient.get(`/restaurants/${restaurantId}/storefront/config`);
    return data || {};
  },

  getPopups: async (restaurantId: string): Promise<PublicPopup[]> => {
    const { data } = await apiClient.get(`/restaurants/${restaurantId}/storefront/popups`);
    const now = new Date().toISOString();
    // Filter for active popups that are within their date range
    return (data || []).filter((p: any) => {
      if (!p.isActive) return false;
      if (p.startDate && new Date(p.startDate) > new Date(now)) return false;
      if (p.endDate && new Date(p.endDate) < new Date(now)) return false;
      return true;
    }).map((p: any) => ({
      ...p,
      imageUrl: resolveMediaUrl(p.imageUrl),
    }));
  },
};