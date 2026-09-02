// app/(owner-dashboard)/dashboard/page.tsx
"use client";

import { ShoppingBag, Wallet, Clock, AlertCircle, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { PendingOrdersWidget } from "@/components/dashboard/pending-orders-widget";
import { SubscriptionBanner } from "@/components/dashboard/subscription-banner";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getRestaurantSubscription } from "@/lib/api/subscriptions";
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
}

export default function DashboardPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  const subscriptionQuery = useQuery({
    queryKey: ["restaurant-subscription", restaurantId],
    queryFn: () => getRestaurantSubscription(restaurantId as string),
    enabled: !!restaurantId,
  });

  const ordersQuery = useQuery({
    queryKey: ["dashboard-pending-orders", restaurantId],
    queryFn: () =>
      listRestaurantOrders(restaurantId as string, "PENDING") as Promise<OwnerOrderRow[]>,
    enabled: !!restaurantId,
  });

  const pendingOrders = (ordersQuery.data ?? []).map((o) => ({
    id: o.id,
    code: o.orderNumber ?? o.id.slice(0, 6),
    customerName: o.customer?.name ?? "Customer",
    itemCount: (o.items ?? []).reduce((sum, i) => sum + (i.quantity ?? 1), 0),
    total: o.total ?? 0,
    placedMinutesAgo: o.createdAt
      ? // eslint-disable-next-line react-hooks/purity
        Math.max(0, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000))
      : 0,
  }));

  const sub = subscriptionQuery.data as
    | { status?: string; planName?: string; daysRemaining?: number; message?: string; expiryDate?: string }
    | undefined;
  const hasNoSubscription = sub?.status === "NO_SUBSCRIPTION";
  const isExpiring = sub?.status === "expiring";

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Today&apos;s overview for your restaurant.</p>
      </div>

      {/* Enhanced Subscription Banners */}
      {hasNoSubscription ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">
                No Active Subscription
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Upgrade to unlock menu management, orders, and analytics.
              </p>
            </div>
          </div>
          <Link
            href="/subscriptions"
            className="w-full sm:w-auto px-4 py-2 bg-[#E3A008] hover:bg-[#d49207] text-[#17181C] text-sm font-semibold rounded-lg transition-colors text-center whitespace-nowrap flex items-center justify-center gap-2"
          >
            <LinkIcon size={16} />
            Upgrade Plan
          </Link>
        </div>
      ) : isExpiring ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-700">
                Subscription Expiring Soon
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Your plan expires on{" "}
                {sub?.expiryDate &&
                  new Date(sub.expiryDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
              </p>
            </div>
          </div>
          <Link
            href="/subscriptions"
            className="w-full sm:w-auto px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold rounded-lg transition-colors text-center whitespace-nowrap flex items-center justify-center gap-2"
          >
            <LinkIcon size={16} />
            Renew Now
          </Link>
        </div>
      ) : (
        sub && (
          <SubscriptionBanner
            subscription={{
              planName: sub.planName ?? "Plan",
              status: (sub.status as "active" | "expiring" | "expired" | "trial") ?? "active",
              expiresAt: sub.expiryDate ?? "",
              daysRemaining: sub.daysRemaining ?? 0,
            }}
          />
        )
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today's Orders" value="—" icon={ShoppingBag} />
        <StatCard label="Today's Revenue" value="—" icon={Wallet} />
        <StatCard
          label="Pending Action"
          value={ordersQuery.isLoading ? "…" : String(pendingOrders.length)}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <RevenueChart data={mockRevenueTrend} />
        </div>
        <div className="lg:col-span-2">
          <PendingOrdersWidget orders={pendingOrders} />
        </div>
      </div>
    </div>
  );
}