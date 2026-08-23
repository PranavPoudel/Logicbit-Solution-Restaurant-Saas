// lib/api/discovery.ts
import { apiClient } from "@/lib/api/client";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import type { RestaurantDetail, MenuCategory, MenuItemDetail } from "@/types/menu";

// Paths confirmed from the API list:
//   GET /discovery/restaurants/nearby?lat=&lng=&radiusKm=&cuisineType=&minRating=&priceRange=&isOpenNow=&sortBy=&page=&limit=
//   GET /discovery/advertisements/homepage-banners
//   GET /discovery/advertisements/popup
// Response body shape (exact field names, pagination envelope) is still
// assumed — adjust the types below once we see a real response.

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

export async function getNearbyRestaurants(
  params: NearbyRestaurantsParams
): Promise<NearbyRestaurantsResponse> {
  // apiClient already unwraps {success, data} — this `data` is the inner
  // payload: { restaurants: [...], pagination: { page, limit, total } }
  const { data } = await apiClient.get("/discovery/restaurants/nearby", { params });

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
