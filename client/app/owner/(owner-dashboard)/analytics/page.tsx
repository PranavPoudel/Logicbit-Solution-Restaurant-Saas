// owner-dashboard/analytics/page.tsx
// This is the analytics page for the owner dashboard. It displays various statistics and charts related to the restaurant's performance.
"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingBag, Users, AlertCircle, Loader2 } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SubscriptionUpgradeBanner } from "@/components/ui/subscription-upgrade-banner";
import { getRestaurantAnalytics } from "@/lib/api/analytics";

export default function AnalyticsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  const { data: analytics, isLoading, isError } = useQuery({
    queryKey: ["owner-analytics", restaurantId],
    queryFn: () => getRestaurantAnalytics(restaurantId as string),
    enabled: !!restaurantId,
  });

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#E3A008]" />
        <p className="text-sm text-neutral-500">Loading analytics data…</p>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-red-300" size={28} />
        <p className="text-sm text-neutral-500">
          Couldn&apos;t load analytics. The backend might not have enough order data yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Analytics & Reports</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track your restaurant&apos;s performance, revenue, and top-selling items.
        </p>
      </div>

      {/* Subscription Guard */}
      <SubscriptionUpgradeBanner />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="Total Revenue" 
          value={`NPR ${analytics.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
        />
        <StatCard 
          label="Total Orders" 
          value={analytics.totalOrders.toString()} 
          icon={ShoppingBag} 
        />
        <StatCard 
          label="New Customers" 
          value={analytics.newCustomers.toString()} 
          icon={Users} 
        />
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Revenue — Last 7 Days</h3>
          {analytics.revenueTrend && analytics.revenueTrend.length > 0 ? (
            <RevenueChart data={analytics.revenueTrend} />
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-neutral-400">
              No revenue data available for this period.
            </div>
          )}
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Top Selling Items</h3>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md">All Time</span>
          </div>
          
          {analytics.topSellingItems && analytics.topSellingItems.length > 0 ? (
            <div className="space-y-4">
              {analytics.topSellingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b border-neutral-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-900">{item.sold} sold</p>
                    <p className="text-xs text-neutral-500">NPR {item.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-neutral-400">
              No sales data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}