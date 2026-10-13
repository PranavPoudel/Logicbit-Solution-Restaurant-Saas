// app/%28customer%29/orders/%5Bid%5D/page.tsx
"use client";

import { use, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Phone, Printer, Star } from "lucide-react";
import { getMyOrder } from "@/lib/api/orders";
import { StatusTimeline } from "@/components/order/status-timeline";
import { ThermalReceipt } from "@/components/print/ThermalReceipt";
import { ReviewModal } from "@/components/review/review-modal";
import { RefundPolicy } from "@/components/cart/refund-policy";

const DONE_STATUSES = ["DELIVERED", "COMPLETED", "CANCELLED"];
const CANCELLABLE_STATUSES = ["PENDING", "ACCEPTED"];

const STATUS_MESSAGES: Record<string, { message: string; pickup?: string }> = {
  PENDING: { message: "Waiting for the restaurant to accept your order." },
  ACCEPTED: { message: "The restaurant accepted your order." },
  PREPARING: { message: "Your food is being prepared." },
  READY: {
    message: "Your food is ready and waiting for a delivery partner.",
    pickup: "Your order is ready. Please come and collect it.",
  },
  OUT_FOR_DELIVERY: {
    message: "Your order is on its way.",
    pickup: "Your order is ready. Please come and collect it.",
  },
  DELIVERED: { message: "Your order was delivered.", pickup: "Your order was picked up." },
  COMPLETED: { message: "Your order was delivered.", pickup: "Your order was picked up." },
};

const OrderMap = dynamic(() => import("@/components/delivery/order-map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-neutral-100 text-sm text-neutral-500">
      Loading map...
    </div>
  ),
});

function BackToOrders() {
  return (
    <Link
      href="/account?tab=orders"
      className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-neutral-500 transition-colors hover:text-[#17181C]"
    >
      <ArrowLeft size={16} />
      Back to orders
    </Link>
  );
}

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
        <BackToOrders />
      </div>
    );
  }

  // Show review prompt ONLY if the order is delivered/completed
  const canReview = order.status === "DELIVERED" || order.status === "COMPLETED";
  const rider = order.delivery?.deliveryPerson;
  const riderOnTheWay = order.status === "OUT_FOR_DELIVERY" || canReview;
  const isPickup = order.orderType === "PICKUP" || order.orderType === "DINE_IN";
  const statusEntry = STATUS_MESSAGES[(order.status ?? "PENDING").toUpperCase()];
  const statusMessage = isPickup ? statusEntry?.pickup ?? statusEntry?.message : statusEntry?.message;
  const restaurantName = order.restaurant?.name ?? "the restaurant";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24">
      <BackToOrders />
      <h1 className="mt-2 font-display font-semibold text-xl text-[#17181C]">
        Order {order.restaurant?.name ? `from ${order.restaurant.name}` : ""}
      </h1>
      <p className="text-xs text-neutral-400 font-mono mt-1">#{order.id}</p>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-5 mt-5">
        <StatusTimeline status={order.status} orderType={order.orderType} />
        {statusMessage && <p className="mt-4 text-center text-sm text-neutral-600">{statusMessage}</p>}
      </div>

      {CANCELLABLE_STATUSES.includes(order.status ?? "") && (
        <p className="mt-4 text-center text-xs text-neutral-500">
          Need to cancel? Please call {restaurantName}
          {order.restaurant?.phone ? ` on ${order.restaurant.phone}` : ""}.
        </p>
      )}

      {order.restaurant?.refundPolicy && (
        <div className="mt-4">
          <RefundPolicy text={order.restaurant.refundPolicy} />
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <div className="bg-white border border-[#E8E7E2] rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#17181C]">Order summary</p>
            {order.status !== "CANCELLED" && (
              <button
                type="button"
                onClick={() => window.print()}
                title="Print or save your receipt as PDF"
                className="flex items-center gap-1.5 rounded-lg border border-[#E8E7E2] px-3 py-1.5 text-xs font-medium text-[#17181C] hover:bg-neutral-50"
              >
                <Printer size={14} /> Receipt
              </button>
            )}
          </div>
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
          <div className="mt-2.5 space-y-1.5 border-t border-[#E8E7E2] pt-2.5 text-sm text-neutral-600">
            {order.subtotal != null && (
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">Rs {order.subtotal}</span>
              </div>
            )}
            {!!order.discountAmount && (
              <div className="flex justify-between text-green-700">
                <span>Discount</span>
                <span className="font-mono">− Rs {order.discountAmount}</span>
              </div>
            )}
            {!isPickup && order.deliveryFee != null && (
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span className="font-mono">Rs {order.deliveryFee}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between text-sm font-semibold text-[#17181C] pt-2.5 mt-2.5 border-t border-[#E8E7E2]">
            <span>Total</span>
            <span className="font-mono">Rs {order.total ?? 0}</span>
          </div>
        </div>

        <div className="space-y-4">
          {canReview && (
            <div className="bg-[#0F6B5C]/5 border border-[#0F6B5C]/20 rounded-2xl p-5 text-center space-y-3">
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
            <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 flex items-center justify-between">
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

          {isPickup && order.status !== "CANCELLED" && order.restaurant?.address && (
            <div className="bg-white border border-[#E8E7E2] rounded-2xl p-5">
              <p className="text-xs text-neutral-400 mb-1">Collect from</p>
              <p className="text-sm font-medium text-[#17181C]">{restaurantName}</p>
              <p className="text-sm text-neutral-600">{order.restaurant.address}</p>
            </div>
          )}

          {order.deliveryAddress && (
            <div className="bg-white border border-[#E8E7E2] rounded-2xl p-5">
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
        </div>
      </div>

      <div className="hidden print:block">
        <ThermalReceipt order={order} />
      </div>

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