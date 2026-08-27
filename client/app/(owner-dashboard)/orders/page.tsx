// app/(owner-dashboard)/orders/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import {
  listRestaurantOrders,
  updateOrderStatus,
  cancelRestaurantOrder,
} from "@/lib/api/orders";
import { OrderTabs } from "@/components/owner-orders/order-tabs";
import { OrderCard, type OwnerOrderSummary } from "@/components/owner-orders/order-card";
import { OrderDetailModal } from "@/components/owner-orders/order-detail-modal";
import { SubscriptionUpgradeBanner } from "@/components/ui/subscription-upgrade-banner";

const TAB_DEFS = [
  { key: "PENDING", label: "New" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Completed" },
];

export default function OrdersPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("PENDING");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["owner-orders", restaurantId],
    queryFn: () => listRestaurantOrders(restaurantId as string) as Promise<OwnerOrderSummary[]>,
    enabled: !!restaurantId,
    refetchInterval: 15000,
  });

  const orders = ordersQuery.data ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(restaurantId as string, orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-orders", restaurantId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (orderId: string) => cancelRestaurantOrder(restaurantId as string, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-orders", restaurantId] });
    },
  });

  const isMutating = statusMutation.isPending || rejectMutation.isPending;

  const tabs = TAB_DEFS.map((tab) => ({
    ...tab,
    count: orders.filter((o) => (o.status ?? "PENDING").toUpperCase() === tab.key).length,
  }));

  const visibleOrders = orders.filter(
    (o) => (o.status ?? "PENDING").toUpperCase() === activeTab
  );

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Orders</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Incoming orders refresh automatically every 15 seconds.
      </p>
       <SubscriptionUpgradeBanner />
       
      <OrderTabs tabs={tabs} activeKey={activeTab} onSelect={setActiveTab} />

      {ordersQuery.isLoading ? (
        <p className="text-sm text-neutral-400 text-center py-12">Loading orders…</p>
      ) : ordersQuery.isError ? (
        <div className="flex flex-col items-center text-center gap-2 py-12">
          <AlertTriangle className="text-neutral-300" size={24} />
          <p className="text-sm text-neutral-500">Couldn&apos;t load orders.</p>
        </div>
      ) : visibleOrders.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-12">
          No orders in this stage right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isMutating={isMutating}
              onView={() => setSelectedOrderId(order.id)}
              onAccept={() =>
                statusMutation.mutate({ orderId: order.id, status: "ACCEPTED" })
              }
              onReject={() => rejectMutation.mutate(order.id)}
              onAdvance={(next) =>
                statusMutation.mutate({ orderId: order.id, status: next })
              }
            />
          ))}
        </div>
      )}

      {selectedOrderId && (
        <OrderDetailModal
          restaurantId={restaurantId}
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}