// components/account/order-history-tab.tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/api/orders";

interface OrderRow {
  id: string;
  restaurant?: { name?: string };
  status?: string;
  total?: number;
  createdAt?: string;
}

export function OrderHistoryTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders() as Promise<OrderRow[]>,
  });

  const orders = data ?? [];

  return (
    <div className="max-w-md py-5 space-y-2.5">
      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-400">No orders yet.</p>
      ) : (
        orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="flex items-center justify-between bg-white border border-[#E8E7E2] rounded-xl p-3.5"
          >
            <div>
              <p className="text-sm font-medium text-[#17181C]">
                {order.restaurant?.name ?? "Order"}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {order.status ?? "—"}
                {order.createdAt ? ` · ${new Date(order.createdAt).toLocaleDateString()}` : ""}
              </p>
            </div>
            <span className="text-sm font-mono text-[#17181C]">Rs {order.total ?? 0}</span>
          </Link>
        ))
      )}
    </div>
  );
}
