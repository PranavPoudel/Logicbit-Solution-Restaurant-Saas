// app/%28customer%29/orders/%5Bid%5D/page.tsx
"use client";

import { use, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Phone, Star } from "lucide-react";
import { getMyOrder } from "@/lib/api/orders";
import { StatusTimeline } from "@/components/order/status-timeline";
import { ReviewModal } from "@/components/review/review-modal";

const DONE_STATUSES = ["DELIVERED", "COMPLETED", "CANCELLED"];
const CANCELLABLE_STATUSES = ["PENDING", "ACCEPTED"];

const OrderMap = dynamic(() => import("@/components/delivery/order-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-neutral-100 text-sm text-neutral-500">
      Loading map...
    </div>
  ),
});

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [showReviewModal, setShowReviewModal] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getMyOrder(id),
    refetchInterval: (query) => (DONE_STATUSES.includes(query.state.data?.status ?? "") ? false : 10000),
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

  // Show review prompt ONLY if the order is delivered/completed
  const canReview = order.status === "DELIVERED" || order.status === "COMPLETED";
  const rider = order.delivery?.deliveryPerson;
  const riderOnTheWay = order.status === "OUT_FOR_DELIVERY" || canReview;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="font-display font-semibold text-xl text-[#17181C]">
        Order {order.restaurant?.name ? `from ${order.restaurant.name}` : ""}
      </h1>
      <p className="text-xs text-neutral-400 font-mono mt-1">#{order.id}</p>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-5 mt-5">
        <StatusTimeline status={order.status} orderType={order.orderType} />
      </div>

      {CANCELLABLE_STATUSES.includes(order.status ?? "") && (
        <p className="mt-4 text-center text-xs text-neutral-500">
          Need to cancel? Please call the restaurant.
        </p>
      )}

      {/* ✅ NEW: Review Prompt (Only shows for Delivered/Completed orders) */}
      {canReview && (
        <div className="bg-[#0F6B5C]/5 border border-[#0F6B5C]/20 rounded-2xl p-5 mt-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-[#0F6B5C]">
            <Star size={18} className="fill-[#0F6B5C]" />
            <span className="font-semibold text-sm">How was your food?</span>
          </div>
          <p className="text-xs text-neutral-600">
            Let the restaurant know how we did! Your feedback helps us improve.
          </p>
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#E3A008] hover:bg-[#d49207] text-[#17181C] font-semibold text-sm rounded-xl transition-colors"
          >
            Rate this Order
          </button>
        </div>
      )}

      {rider && riderOnTheWay && (
        <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400">Delivery partner</p>
            <p className="text-sm font-medium text-[#17181C]">
              {rider.name ?? "Assigned"}
            </p>
          </div>
          {rider.phone && (
            <a
              href={`tel:${rider.phone}`}
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
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <span className="block text-xs text-neutral-400">
                    {item.selectedModifiers.map((m) => m.name).join(", ")}
                  </span>
                )}
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

          {order.deliveryLatitude != null && order.deliveryLongitude != null && (
            <div className="mt-4 h-72 overflow-hidden rounded-xl border border-brand-line isolate">
              <OrderMap
                restaurant={
                  order.restaurant?.latitude != null && order.restaurant?.longitude != null
                    ? { lat: order.restaurant.latitude, lng: order.restaurant.longitude, name: order.restaurant.name }
                    : null
                }
                customer={{ lat: order.deliveryLatitude, lng: order.deliveryLongitude, address: order.deliveryAddress }}
              />
            </div>
          )}
        </div>
      )}

      <ReviewModal
        orderId={order.id}
        restaurantId={order.restaurant?.id ?? ""}        
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSuccess={() => {
          setShowReviewModal(false);
          // Invalidate the order query so the UI updates (e.g., hides the prompt if backend tracks "hasReview")
          queryClient.invalidateQueries({ queryKey: ["order", id] });
        }}
      />
    </div>
  );
}