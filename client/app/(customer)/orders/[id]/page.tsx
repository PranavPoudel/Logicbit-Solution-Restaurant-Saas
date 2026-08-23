// app/(customer)/orders/[id]/page.tsx
"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Phone } from "lucide-react";
import { getMyOrder } from "@/lib/api/orders";
import { StatusTimeline } from "@/components/order/status-timeline";

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getMyOrder(id),
  });

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-sm text-neutral-400">
        Loading order…
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          Couldn&apos;t load this order. Please check your order history.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="font-display font-semibold text-xl text-[#17181C]">
        Order {order.restaurant?.name ? `from ${order.restaurant.name}` : ""}
      </h1>
      <p className="text-xs text-neutral-400 font-mono mt-1">#{order.id}</p>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-5 mt-5">
        <StatusTimeline status={order.status} />
      </div>

      {order.deliveryPerson && (
        <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400">Delivery partner</p>
            <p className="text-sm font-medium text-[#17181C]">
              {order.deliveryPerson.fullName ?? "Assigned"}
            </p>
          </div>
          {order.deliveryPerson.phone && (
            <a
              href={`tel:${order.deliveryPerson.phone}`}
              className="w-10 h-10 rounded-full bg-[#0F6B5C]/10 text-[#0F6B5C] flex items-center justify-center"
              aria-label="Call delivery partner"
            >
              <Phone size={16} />
            </a>
          )}
        </div>
      )}

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4">
        <p className="text-sm font-medium text-[#17181C] mb-2.5">Order summary</p>
        <div className="space-y-1.5">
          {(order.items ?? []).map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-neutral-600">
              <span>
                {item.quantity ?? 1}× {item.menuItem?.name ?? `Item (Rs ${item.unitPrice ?? "?"})`}
              </span>
              <span className="font-mono">Rs {item.subtotal ?? item.price ?? 0}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-semibold text-[#17181C] pt-2.5 mt-2.5 border-t border-[#E8E7E2]">
          <span>Total</span>
          <span className="font-mono">Rs {order.total ?? 0}</span>
        </div>
      </div>

      {order.deliveryAddress && (
        <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4">
          <p className="text-xs text-neutral-400 mb-1">Delivering to</p>
          <p className="text-sm text-[#17181C]">{order.deliveryAddress}</p>
        </div>
      )}
    </div>
  );
}