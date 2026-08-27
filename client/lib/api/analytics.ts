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

export async function getRestaurantAnalytics(restaurantId: string): Promise<RestaurantAnalytics> {
  const { data } = await ownerApiClient.get(`/analytics/${restaurantId}`);
  return data;
}