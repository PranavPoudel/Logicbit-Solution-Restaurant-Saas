// lib/api/discovery.ts
import { apiClient } from "@/lib/api/client";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import type { RestaurantDetail, MenuCategory, MenuItemDetail } from "@/types/menu";

export interface NearbyRestaurantsParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  cuisineId?: string; 
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
  if (params.cuisineId) {
    queryParams.cuisineId = params.cuisineId;
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
  imageUrl: string;
  title?: string;
  linkUrl?: string;
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
  imageUrl: string;
  title: string;
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
  if (Array.isArray(data)) return data;
  return data?.categories ?? [];
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

export async function getRestaurantReviews(restaurantId: string) {
  const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/reviews`);
  return data;
}

export async function getRestaurantStorefront(restaurantId: string) {
  const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/storefront`);
  return data;
}

export async function getRestaurantStorefrontPopup(restaurantId: string) {
  const { data } = await apiClient.get(
    `/discovery/restaurants/${restaurantId}/storefront/popup`
  );
  return data;
}