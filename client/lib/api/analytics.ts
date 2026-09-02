// lib/api/analytics.ts
import { ownerApiClient } from "@/lib/api/owner-client";

export interface RevenueTrend {
  date: string;
  revenue: number;
}

export interface TopSellingItem {
  name: string;
  sold: number;
  revenue: number;
}

export interface RestaurantAnalytics {
  totalRevenue: number;
  totalOrders: number;
  newCustomers: number;
  revenueTrend: RevenueTrend[];
  topSellingItems: TopSellingItem[];
}

/**
 * Fetches analytics data for a specific restaurant.
 * Endpoint: GET /api/v1/restaurants/:restaurantId/analytics
 */
export async function getRestaurantAnalytics(restaurantId: string): Promise<RestaurantAnalytics> {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/analytics`);
  return data;
}