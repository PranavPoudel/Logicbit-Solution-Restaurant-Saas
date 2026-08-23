// app/(owner-dashboard)/dashboard/page.tsx
"use client";

import { ShoppingBag, Wallet, Clock } from "lucide-react";
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
    | { status?: string; planName?: string; daysRemaining?: number; message?: string }
    | undefined;
  const hasNoSubscription = sub?.status === "NO_SUBSCRIPTION";

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Today&apos;s overview for your restaurant.</p>
      </div>

      {hasNoSubscription ? (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border bg-neutral-50 border-neutral-200 text-neutral-600">
          <p className="text-sm flex-1">
            {sub?.message ?? "No active subscription."}
          </p>
        </div>
      ) : (
        sub && (
          <SubscriptionBanner
            subscription={{
              planName: sub.planName ?? "Plan",
              status: (sub.status as "active" | "expiring" | "expired" | "trial") ?? "active",
              expiresAt: "",
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