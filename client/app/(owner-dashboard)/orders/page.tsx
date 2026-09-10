// app/(owner-dashboard)/orders/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import {
  listRestaurantOrders,
  updateOrderStatus,
  cancelRestaurantOrder,
} from "@/lib/api/orders";
import { OrderTabs } from "@/components/owner-orders/order-tabs";
import { OrderCard, type OwnerOrderSummary } from "@/components/owner-orders/order-card";
import { OrderDetailModal } from "@/components/owner-orders/order-detail-modal";
import { OrderTable } from "@/components/owner-orders/order-table";
import { SubscriptionUpgradeBanner } from "@/components/ui/subscription-upgrade-banner";

const TAB_DEFS = [
  { key: "ALL", label: "All Orders", isSystem: true },
  { key: "PENDING", label: "New" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Completed" },
  { key: "TRASH", label: "Trash", isSystem: true, icon: Trash2 },
];

export default function OrdersPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Fetch all orders (for ALL tab and general data)
  const allOrdersQuery = useQuery({
    queryKey: ["owner-orders", restaurantId, "all"],
    queryFn: () => listRestaurantOrders(restaurantId as string) as Promise<OwnerOrderSummary[]>,
    enabled: !!restaurantId,
    refetchInterval: 15000,
  });

  // Fetch filtered orders (for status tabs)
  const filteredOrdersQuery = useQuery({
    queryKey: ["owner-orders", restaurantId, activeTab],
    queryFn: () => {
      if (activeTab === "ALL" || activeTab === "TRASH") {
        return listRestaurantOrders(restaurantId as string) as Promise<OwnerOrderSummary[]>;
      }
      return listRestaurantOrders(restaurantId as string, activeTab) as Promise<OwnerOrderSummary[]>;
    },
    enabled: !!restaurantId && activeTab !== "ALL",
    refetchInterval: 15000,
  });

  const allOrders = allOrdersQuery.data ?? [];
  const filteredOrders = filteredOrdersQuery.data ?? [];
  
  // Use all orders for ALL tab, filtered for others, and cancelled for TRASH
  const orders = activeTab === "ALL" 
    ? allOrders 
    : activeTab === "TRASH"
    ? allOrders.filter(o => (o.status ?? "").toUpperCase() === "CANCELLED")
    : filteredOrders;

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(restaurantId as string, orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-orders", restaurantId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => cancelRestaurantOrder(restaurantId as string, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-orders", restaurantId] });
    },
  });

  const isMutating = statusMutation.isPending || cancelMutation.isPending;

  // Calculate counts for tabs
  const tabs = TAB_DEFS.map((tab) => {
    if (tab.key === "ALL") {
      const nonCancelled = allOrders.filter(o => (o.status ?? "").toUpperCase() !== "CANCELLED");
      return { ...tab, count: nonCancelled.length };
    }
    if (tab.key === "TRASH") {
      const cancelled = allOrders.filter(o => (o.status ?? "").toUpperCase() === "CANCELLED");
      return { ...tab, count: cancelled.length };
    }
    const count = allOrders.filter((o) => (o.status ?? "PENDING").toUpperCase() === tab.key).length;
    return { ...tab, count };
  });

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
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-neutral-900">Orders</h1>
        <p className="text-xs text-neutral-500">
          Auto-refresh every 15 seconds
        </p>
      </div>
      <p className="text-sm text-neutral-500 mb-6">
        Manage and track all your restaurant orders.
      </p>
      
      <SubscriptionUpgradeBanner />
       
      <OrderTabs tabs={tabs} activeKey={activeTab} onSelect={setActiveTab} />

      {allOrdersQuery.isLoading ? (
        <p className="text-sm text-neutral-400 text-center py-12">Loading orders…</p>
      ) : allOrdersQuery.isError ? (
        <div className="flex flex-col items-center text-center gap-2 py-12">
          <AlertTriangle className="text-neutral-300" size={24} />
          <p className="text-sm text-neutral-500">Couldn&apos;t load orders.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-2 py-12">
          <AlertTriangle className="text-neutral-300" size={24} />
          <p className="text-sm text-neutral-500">
            {activeTab === "ALL" 
              ? "No orders yet."
              : activeTab === "TRASH"
              ? "No cancelled orders."
              : "No orders in this stage right now."}
          </p>
        </div>
      ) : activeTab === "ALL" || activeTab === "TRASH" ? (
        // Table view for ALL and TRASH tabs
        <OrderTable
          orders={orders}
          isTrash={activeTab === "TRASH"}
          isMutating={isMutating}
          onView={(orderId) => setSelectedOrderId(orderId)}
          onStatusChange={(orderId, status) =>
            statusMutation.mutate({ orderId, status })
          }
          onCancel={(orderId) => cancelMutation.mutate(orderId)}
        />
      ) : (
        // Card view for workflow tabs
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isMutating={isMutating}
              onView={() => setSelectedOrderId(order.id)}
              onAccept={() =>
                statusMutation.mutate({ orderId: order.id, status: "ACCEPTED" })
              }
              onReject={() => cancelMutation.mutate(order.id)}
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