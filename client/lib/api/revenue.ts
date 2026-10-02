import { platformApiClient } from "@/lib/api/platform-client";

export interface RevenueTransaction {
  id: string;
  restaurantName: string;
  planName: string;
  amount: number;
  date: string;
  status: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  mrr: number;
  activeSubscriptions: number;
  recentTransactions: RevenueTransaction[];
}

export async function getRevenueSummary(): Promise<RevenueSummary> {
  const response = await platformApiClient.get("/platform-admin/revenue-summary");
  return response.data?.data || response.data;
}