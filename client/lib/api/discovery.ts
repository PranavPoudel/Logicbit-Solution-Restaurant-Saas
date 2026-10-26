// lib/api/discovery.ts
import { apiClient } from "@/lib/api/client";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import type { RestaurantDetail, MenuCategory, MenuItemDetail } from "@/types/menu";
import type { PublicPopup } from "@/lib/api/public-storefront";

export interface NearbyRestaurantsParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  cuisineType?: string; 
  minRating?: number;
  isOpenNow?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface NearbyRestaurantsResponse {
  data: DiscoveryRestaurant[];
  page: number;
  limit: number;
  total: number;
}

export async function getPublicRestaurant(id: string) {
  const { data } = await apiClient.get(`/discovery/restaurants/${id}`);
  return data;
}
export async function getNearbyRestaurants(
  params: NearbyRestaurantsParams
): Promise<NearbyRestaurantsResponse> {
  // Build query params object, filtering out undefined values
  const queryParams: Record<string, string | number | boolean> = {
    lat: params.lat,
    lng: params.lng,
    radiusKm: params.radiusKm ?? 10,
  };

  // Only add optional params if they exist
  if (params.cuisineType) {
    queryParams.cuisineType = params.cuisineType;
  }
  if (params.minRating) {
    queryParams.minRating = params.minRating;
  }
  if (params.isOpenNow !== undefined) {
    queryParams.isOpenNow = params.isOpenNow;
  }
  if (params.sortBy) {
    queryParams.sortBy = params.sortBy;
  }
  if (params.page) {
    queryParams.page = params.page;
  }
  if (params.limit) {
    queryParams.limit = params.limit;
  }

  const { data } = await apiClient.get("/discovery/restaurants/nearby", { 
    params: queryParams 
  });

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[discovery/restaurants/nearby] unwrapped payload:", data);
  }

  const restaurants = data?.restaurants ?? [];
  const pagination = data?.pagination ?? {};

  return {
    data: restaurants,
    page: pagination.page ?? 1,
    limit: pagination.limit ?? 20,
    total: pagination.total ?? restaurants.length,
  };
}

export interface HomepageBanner {
  id: string;
  imageUrl?: string | null;
  title?: string;
  linkUrl?: string | null;
  restaurant?: { id: string; name: string; slug?: string };
}

export async function getHomepageBanners(): Promise<HomepageBanner[]> {
  const { data } = await apiClient.get("/discovery/advertisements/homepage-banners");

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[discovery/advertisements/homepage-banners] unwrapped payload:", data);
  }

  if (Array.isArray(data)) return data;
  return data?.banners ?? [];
}

export interface PopupAdResponse {
  id: string;
  imageUrl?: string | null;
  title: string;
  linkUrl?: string | null;
  description?: string;
}

export async function getPopupAd(): Promise<PopupAdResponse | null> {
  const { data } = await apiClient.get<PopupAdResponse | null>(
    "/discovery/advertisements/popup"
  );
  return data;
}

// --- remaining Module 9 endpoints ---

export async function getRestaurantByIdOrSlug(idOrSlug: string): Promise<RestaurantDetail> {
  const { data } = await apiClient.get(`/discovery/restaurants/${idOrSlug}`);
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[discovery/restaurants/:idOrSlug] unwrapped payload:", data);
  }
  // Some backends nest the restaurant under a `restaurant` key — handle both.
  return data?.restaurant ?? data;
}

export async function getRestaurantMenu(
  restaurantId: string,
  lang?: string
): Promise<MenuCategory[]> {
  const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/menu`, {
    params: lang ? { lang } : undefined,
  });

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[discovery/restaurants/:id/menu] unwrapped payload:", data);
  }

  // Extract the categories array
  const rawCategories = Array.isArray(data) ? data : data?.categories ?? [];

  // Normalize the data: rename 'menuItems' to 'items' so the UI works perfectly
  return rawCategories.map((cat: any) => ({
    ...cat,
    items: cat.menuItems || cat.items || [], 
  }));
}
export async function getMenuItemDetail(
  restaurantId: string,
  menuItemId: string
): Promise<MenuItemDetail> {
  const { data } = await apiClient.get(
    `/discovery/restaurants/${restaurantId}/menu-items/${menuItemId}`
  );
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[discovery/.../menu-items/:id] unwrapped payload:", data);
  }
  return data;
}

export async function searchMenu(restaurantId: string, q: string) {
  const { data } = await apiClient.get(
    `/discovery/restaurants/${restaurantId}/menu/search`,
    { params: { q } }
  );
  return data;
}

export async function getFeaturedItems(restaurantId: string) {
  const { data } = await apiClient.get(
    `/discovery/restaurants/${restaurantId}/menu/featured-items`
  );
  return data;
}

export async function getTrendingItems() {
  const { data } = await apiClient.get("/discovery/trending-items");
  return data;
}

export async function getFeaturedCategories(restaurantId: string) {
  const { data } = await apiClient.get(
    `/discovery/restaurants/${restaurantId}/menu/featured-categories`
  );
  return data;
}

export async function checkDeliveryAvailability(
  restaurantId: string,
  lat: number,
  lng: number
) {
  const { data } = await apiClient.get(
    `/discovery/restaurants/${restaurantId}/delivery-check`,
    { params: { lat, lng } }
  );
  return data;
}

/*
export async function getRestaurantStorefront(restaurantId: string) {
  const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/storefront`);
  return data;
}

export async function getRestaurantStorefrontPopup(restaurantId: string) {
  const { data } = await apiClient.get(
    `/discovery/restaurants/${restaurantId}/storefront/popup`
  );
  return data;
}*/

export interface SectionSetting {
  id: string;
  isVisible: boolean;
  titleEn: string;
  titleJa: string;
}

export interface StorefrontConfig {
  aboutText?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  socialLinks?: Record<string, string>;
  sectionSettings?: SectionSetting[];
}

export interface StorefrontBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  displayOrder?: number;
}

export type StorefrontPopup = PublicPopup;

export interface StorefrontOffer {
  id: string;
  code: string | null;
  type: "PERCENTAGE" | "FLAT";
  value: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  validUntil?: string | null;
}

export interface StorefrontData {
  banners: StorefrontBanner[];
  offers?: StorefrontOffer[];
  about?: string;
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  socialLinks?: Record<string, string>;
  sectionSettings?: SectionSetting[];
}

export async function getRestaurantStorefront(restaurantId: string): Promise<StorefrontData> {
  const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/storefront`);
  return data?.data ?? data;
}

export async function getRestaurantStorefrontPopup(restaurantId: string): Promise<StorefrontPopup | null> {
  const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/storefront/popup`);
  if (process.env.NODE_ENV === "development") {
    console.log("[storefront/popup] unwrapped payload:", data);
  }
  return data?.data ?? data;
}

const FETCH_SIZE = 50;
const MAX_FETCH_PAGES = 10;

export async function getAllNearby(lat: number, lng: number) {
  const first = await getNearbyRestaurants({ lat, lng, radiusKm: 50, limit: FETCH_SIZE });
  const pages = Math.min(Math.ceil(first.total / FETCH_SIZE), MAX_FETCH_PAGES);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => getNearbyRestaurants({ lat, lng, radiusKm: 50, limit: FETCH_SIZE, page: i + 2 })));
  return { rows: [first, ...rest].flatMap((p) => p.data), total: first.total };
}
