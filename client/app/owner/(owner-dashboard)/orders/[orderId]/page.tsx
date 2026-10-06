// app/owner/(owner-dashboard)/orders/[orderId]/page.tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, ShoppingBag, User, MapPin, Clock } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getOrderById } from "@/lib/api/orders";

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => getOrderById(restaurantId as string, orderId),
    enabled: !!restaurantId && !!orderId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-neutral-500">
        Loading order details...
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">Order not found or you don&apos;t have permission to view it.</p>
        {/* ✅ FIX 1: Added leading slash to ensure absolute path to owner orders */}
        <button 
          onClick={() => router.push("/owner/orders")} 
          className="text-sm text-[#1B2333] font-medium hover:underline flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        {/* ✅ FIX 2: Changed from "/orders" to "/owner/orders" */}
        <button 
          onClick={() => router.push("/owner/orders")} 
          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            Order #{order.orderNumber || order.id.slice(0, 6).toUpperCase()}
          </h1>
          <p className="text-sm text-neutral-500">
            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Unknown date"}
          </p>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        {/* Status Banner */}
        <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-600">Current Status</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 uppercase tracking-wide">
            {order.status || "PENDING"}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase">Customer</p>
                <p className="text-sm font-medium text-neutral-900">{order.customer?.name || "Guest"}</p>
                <p className="text-sm text-neutral-600">{order.customer?.phone || "No phone"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-neutral-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase">Delivery Address</p>
                <p className="text-sm text-neutral-900">{order.deliveryAddress || "Pickup"}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-800">Order Items</h3>
            </div>
            <ul className="space-y-3">
              {order.items?.map((item: any, idx: number) => (
                <li key={idx} className="flex justify-between items-start text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-neutral-900">{item.quantity}x</span>
                    <span className="text-neutral-700 ml-2">{item.menuItem?.name || item.name || "Menu Item"}</span>
                    {item.notes && <p className="text-xs text-neutral-500 mt-1 italic">Note: {item.notes}</p>}
                  </div>
                  <span className="font-mono text-neutral-900">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="border-t border-neutral-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Subtotal</span>
              <span>Rs. {(order.total || 0).toLocaleString()}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Delivery Fee</span>
                <span>Rs. {order.deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
              <span className="text-base font-bold text-neutral-900">Total</span>
              <span className="text-xl font-bold text-[#1B2333]">
                Rs. {(order.total || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 uppercase">Customer Notes</p>
                <p className="text-sm text-amber-900 mt-1">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}