// app/owner/(owner-dashboard)/dashboard/page.tsx
"use client";

import { ShoppingBag, Wallet, Clock, CheckCircle2, AlertCircle, Link as LinkIcon, Users } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { QueryError } from "@/components/ui/query-error";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PendingOrdersWidget } from "@/components/dashboard/pending-orders-widget";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getRestaurantSubscription } from "@/lib/api/subscriptions";
import { getRestaurantAnalytics } from "@/lib/api/analytics";
import { listRestaurantOrders } from "@/lib/api/orders";

const mockRevenueTrend = [
  { date: "Mon", revenue: 12500 },
  { date: "Tue", revenue: 15800 },
  { date: "Wed", revenue: 11200 },
  { date: "Thu", revenue: 18900 },
  { date: "Fri", revenue: 24100 },
  { date: "Sat", revenue: 29800 },
  { date: "Sun", revenue: 21400 },
];

interface OwnerOrderRow {
  id: string;
  orderNumber?: string;
  customer?: { name?: string };
  items?: Array<{ quantity?: number }>;
  total?: number;
  createdAt?: string;
  status?: string;
}

export default function DashboardPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  // 1. Subscription Query
  const subscriptionQuery = useQuery({
    queryKey: ["restaurant-subscription", restaurantId],
    queryFn: () => getRestaurantSubscription(restaurantId as string),
    enabled: !!restaurantId,
  });

  // 2. Pending Orders Query
  const ordersQuery = useQuery({
    queryKey: ["dashboard-pending-orders", restaurantId],
    queryFn: () => listRestaurantOrders(restaurantId as string, "PENDING") as Promise<OwnerOrderRow[]>,
    enabled: !!restaurantId,
  });

  // 3. Analytics Query (REAL DATA)
  const analyticsQuery = useQuery({
    queryKey: ["dashboard-analytics", restaurantId],
    queryFn: () => getRestaurantAnalytics(restaurantId as string),
    enabled: !!restaurantId,
  });

  const analytics = analyticsQuery.data;

  // ✅ Map orders safely, ensuring 'id' is always present and valid
  const pendingOrders = (ordersQuery.data ?? []).map((o) => ({
    id: o.id,
    code: o.orderNumber ?? (o.id ? o.id.slice(0, 6).toUpperCase() : "N/A"),
    customerName: o.customer?.name ?? "Customer",
    itemCount: (o.items ?? []).reduce((sum, i) => sum + (i.quantity ?? 1), 0),
    total: o.total ?? 0,
    placedMinutesAgo: o.createdAt
      ? Math.max(0, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000))
      : 0,
  }));

  // 🔍 DIAGNOSTIC LOG: Check your browser console to confirm IDs are flowing correctly
  console.log("Dashboard Pending Orders Data:", pendingOrders);

  const sub = subscriptionQuery.data;
  const hasNoSubscription = sub && "status" in sub && sub.status === "NO_SUBSCRIPTION";
  const isExpiring = sub && "status" in sub && sub.status === "expiring";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Here&apos;s what&apos;s happening at your restaurant today.</p>
      </div>

      {/* Subscription Banners */}
      {hasNoSubscription ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">No Active Subscription</p>
              <p className="text-xs text-red-600 mt-0.5">Upgrade to unlock menu management, orders, and analytics.</p>
            </div>
          </div>
          <Link href="/subscriptions" className="w-full sm:w-auto px-4 py-2 bg-[#E3A008] hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors text-center whitespace-nowrap flex items-center justify-center gap-2">
            <LinkIcon size={16} /> Upgrade Plan
          </Link>
        </div>
      ) : isExpiring ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700">Subscription Expiring Soon</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Your plan expires on {sub && "expiryDate" in sub && sub.expiryDate 
                  ? new Date(sub.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                  : "soon"}
              </p>
            </div>
          </div>
          <Link href="/subscriptions" className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors text-center whitespace-nowrap flex items-center justify-center gap-2">
            <LinkIcon size={16} /> Renew Now
          </Link>
        </div>
      ) : sub ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">
            Active Plan: <span className="font-semibold">{sub && "planName" in sub ? sub.planName : "Standard"}</span>
            {sub && "daysRemaining" in sub && sub.daysRemaining && ` · ${sub.daysRemaining} days remaining`}
          </p>
        </div>
      ) : null}

      {(analyticsQuery.isError || ordersQuery.isError) && (
        <QueryError
          what="some dashboard data"
          error={analyticsQuery.error ?? ordersQuery.error}
          onRetry={() => { analyticsQuery.refetch(); ordersQuery.refetch(); }}
        />
      )}

      {/* Stat Cards Grid (Sakura Style with Color Variants & Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Orders"
          value={analyticsQuery.isLoading ? "…" : (analytics?.totalOrders ?? 0).toString()}
          icon={ShoppingBag}
          colorVariant="amber"
        />
        <StatCard
          label="Today's Revenue"
          value={analyticsQuery.isLoading ? "…" : `Rs. ${(analytics?.totalRevenue ?? 0).toLocaleString()}`}
          icon={Wallet}
          colorVariant="teal"
        />
        <StatCard
          label="Pending Action"
          value={ordersQuery.isLoading ? "…" : String(pendingOrders.length)}
          icon={Clock}
          colorVariant="blue"
        />
        <StatCard
          label="New Customers"
          value={analyticsQuery.isLoading ? "…" : (analytics?.newCustomers ?? 0).toString()}
          icon={Users}
          colorVariant="purple"
        />
      </div>

      {/* Main Content Grid: Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-3 bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4">Revenue Overview (Last 7 Days)</h3>
          <RevenueChart data={analytics?.revenueTrend ?? mockRevenueTrend} />
        </div>

        {/* Recent / Pending Orders Widget */}
        <div className="lg:col-span-2">
          <PendingOrdersWidget orders={pendingOrders} />
        </div>
      </div>
    </div>
  );
}