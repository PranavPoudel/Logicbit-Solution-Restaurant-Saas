// components/account/order-history-tab.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/api/orders";
import { AccountRow } from "@/components/account/account-row";
import { FilterChips } from "@/components/account/filter-chips";

interface OrderRow {
  id: string;
  orderNumber?: string;
  restaurant?: { name?: string };
  status?: string;
  total?: number;
  createdAt?: string;
}

type Category = "all" | "active" | "completed" | "cancelled";

function getCategory(status?: string): Exclude<Category, "all"> {
  if (status === "DELIVERED" || status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "cancelled";
  return "active";
}

const BADGES: Record<Exclude<Category, "all">, string> = {
  active: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-neutral-100 text-neutral-500",
};

const statusLabel = (status?: string) =>
  status ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ") : "—";

export function OrderHistoryTab() {
  const [category, setCategory] = useState<Category>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders() as Promise<OrderRow[]>,
  });

  const orders = data ?? [];
  const count = (c: Category) => (c === "all" ? orders.length : orders.filter((o) => getCategory(o.status) === c).length);
  const filters = [
    { key: "all", label: "All", count: count("all") },
    { key: "active", label: "Active", count: count("active") },
    { key: "completed", label: "Completed", count: count("completed") },
    { key: "cancelled", label: "Cancelled", count: count("cancelled") },
  ] as const;
  const visible = category === "all" ? orders : orders.filter((o) => getCategory(o.status) === category);

  return (
    <div className="max-w-3xl pb-5 space-y-4">
      <FilterChips filters={filters} active={category} onChange={setCategory} />

      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-neutral-400">{orders.length === 0 ? "No orders yet." : "No orders in this category."}</p>
      ) : (
        <div key={category} className="space-y-3">
          {visible.map((order, i) => (
            <AccountRow
              key={order.id}
              href={`/orders/${order.id}`}
              title={order.restaurant?.name ?? "Order"}
              subtitle={[order.orderNumber && `#${order.orderNumber}`, order.createdAt && new Date(order.createdAt).toLocaleDateString()]
                .filter(Boolean)
                .join(" · ")}
              amount={order.total ?? 0}
              badge={{ label: statusLabel(order.status), style: BADGES[getCategory(order.status)] }}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
