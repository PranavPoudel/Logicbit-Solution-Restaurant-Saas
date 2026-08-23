// components/owner-orders/order-detail-modal.tsx
"use client";

import { X, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRestaurantOrder } from "@/lib/api/orders";

interface OrderDetailData {
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  customer?: { name?: string; phone?: string };
  deliveryAddress?: string;
  orderType?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  subtotal?: number;
  deliveryFee?: number;
  discountAmount?: number;
  total?: number;
  items?: Array<{
    id: string;
    menuItem?: { name?: string };
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
  }>;
}

export function OrderDetailModal({
  restaurantId,
  orderId,
  onClose,
}: {
  restaurantId: string;
  orderId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["owner-order-detail", restaurantId, orderId],
    queryFn: () => getRestaurantOrder(restaurantId, orderId) as Promise<OrderDetailData>,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900">
            {isLoading ? "Loading…" : "#" + (data?.orderNumber ?? orderId.slice(0, 8))}
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-neutral-400" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-400 text-center py-12">Loading order…</p>
        ) : !data ? (
          <p className="text-sm text-neutral-400 text-center py-12">Couldn&apos;t load this order.</p>
        ) : (
          <div className="overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400">Customer</p>
                <p className="text-sm font-medium text-neutral-900">
                  {data.customer?.name ?? "Customer"}
                </p>
              </div>
              {data.customer?.phone && (
                <button
                  onClick={() => {
                    window.location.href = "tel:" + data.customer!.phone;
                  }}
                  className="w-9 h-9 rounded-full bg-[#0F6B5C]/10 text-[#0F6B5C] flex items-center justify-center"
                  aria-label="Call customer"
                >
                  <Phone size={15} />
                </button>
              )}
            </div>

            {data.deliveryAddress && (
              <div>
                <p className="text-xs text-neutral-400">Delivery address</p>
                <p className="text-sm text-neutral-800">{data.deliveryAddress}</p>
              </div>
            )}

            <div className="flex gap-4 text-xs text-neutral-500">
              <span>{data.orderType ?? "—"}</span>
              <span>·</span>
              <span>
                {data.paymentMethod ?? "—"} ({data.paymentStatus ?? "—"})
              </span>
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <p className="text-xs font-medium text-neutral-500 mb-2">Items</p>
              <div className="space-y-1.5">
                {(data.items ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-neutral-700">
                      {item.quantity ?? 1}× {item.menuItem?.name ?? "Item (Rs " + (item.unitPrice ?? "?") + ")"}
                    </span>
                    <span className="font-mono text-neutral-600">
                      Rs {item.subtotal ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-mono">Rs {data.subtotal ?? 0}</span>
              </div>
              {!!data.deliveryFee && (
                <div className="flex justify-between text-neutral-500">
                  <span>Delivery fee</span>
                  <span className="font-mono">Rs {data.deliveryFee}</span>
                </div>
              )}
              {!!data.discountAmount && (
                <div className="flex justify-between text-[#0F6B5C]">
                  <span>Discount</span>
                  <span className="font-mono">-Rs {data.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-neutral-900 pt-1.5 border-t border-neutral-100">
                <span>Total</span>
                <span className="font-mono">Rs {data.total ?? 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}