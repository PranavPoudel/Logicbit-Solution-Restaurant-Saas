// app/owner/(owner-dashboard)/orders/[orderId]/page.tsx
"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, ShoppingBag, User, MapPin, Clock, Printer, AlertCircle , ChefHat} from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { OrderActions, RiderCard } from "@/components/layout/owner-notifications";
import { getOrderById, rejectRider, updateOrderStatus } from "@/lib/api/orders";
import { ThermalReceipt } from "@/components/print/ThermalReceipt";
import { KitchenTicket } from "@/components/print/KitchenTicket"; 

const RIDER_STATUS = { approve: "OUT_FOR_DELIVERY", complete: "DELIVERED" } as const;

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();

  // 🆕 Two separate states for the two print views
  const [isReprinting, setIsReprinting] = useState(false);
  const [isPrintingKitchen, setIsPrintingKitchen] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => getOrderById(restaurantId as string, orderId),
    enabled: !!restaurantId && !!orderId,
    refetchInterval: 15000,
  });


  const riderMutation = useMutation({
    mutationFn: (action: keyof typeof RIDER_STATUS | "reject") =>
      action === "reject"
        ? rejectRider(restaurantId as string, orderId)
        : updateOrderStatus(restaurantId as string, orderId, RIDER_STATUS[action]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["owner-orders", restaurantId] });
    },
  });

  const handleReprint = () => {
    setIsReprinting(true);
    setTimeout(() => {
      window.print();
      setIsReprinting(false);
    }, 500);
  };

    //  Handler for Kitchen Ticket
  const handlePrintKitchen = () => {
    setIsPrintingKitchen(true);
    setTimeout(() => {
      window.print();
      setIsPrintingKitchen(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-neutral-500">Loading order details...</div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">Order not found.</p>
        <button onClick={() => router.push("/owner/orders")} className="text-sm text-[#1B2333] font-medium hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Orders
        </button>
      </div>
    );
  }

  const rider = order.delivery?.deliveryPerson;
  const awaitingApproval = order.status === "READY" && order.delivery?.status === "ASSIGNED";
  const awaitingConfirm = order.status === "OUT_FOR_DELIVERY" && order.delivery?.status === "DELIVERED";

   return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/owner/orders")} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Order #{order.orderNumber}</h1>
            <p className="text-sm text-neutral-500">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
        
        {/*  Two Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrintKitchen}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F6B5C] text-white rounded-lg hover:bg-[#0a4d42] transition-colors shadow-sm"
          >
            <ChefHat size={18} />
            <span className="text-sm font-medium">Kitchen Ticket</span>
          </button>

          <button
            onClick={handleReprint}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2333] text-white rounded-lg hover:bg-[#2D3748] transition-colors shadow-sm"
          >
            <Printer size={18} />
            <span className="text-sm font-medium">Customer Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-600">Current Status</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 uppercase tracking-wide">
            {order.status || "PENDING"}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {rider && (
            <div>
              <RiderCard order={order} />
              {awaitingConfirm && (
                <OrderActions large disabled={riderMutation.isPending} acceptLabel="Confirm complete" onAccept={() => riderMutation.mutate("complete")} />
              )}
              {awaitingApproval && (
                <OrderActions large disabled={riderMutation.isPending} acceptLabel="Approve & send out" onAccept={() => riderMutation.mutate("approve")} onReject={() => riderMutation.mutate("reject")} />
              )}
            </div>
          )}

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

          {/* 🆕 Order Items with Modifiers & Notes */}
          <div className="border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-semibold text-neutral-800">Order Items</h3>
            </div>
            <ul className="space-y-4">
              {order.items?.map((item: any, idx: number) => (
                <li key={idx} className="flex justify-between items-start text-sm border-b border-dashed border-neutral-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex-1 pr-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-neutral-900">{item.quantity}x</span>
                      <span className="font-medium text-neutral-800">{item.menuItem?.name || item.name || "Menu Item"}</span>
                    </div>
                    
                    {/* Modifiers List */}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <ul className="mt-1.5 ml-6 space-y-0.5">
                        {item.selectedModifiers.map((mod: any, mIdx: number) => (
                          <li key={mIdx} className="text-xs text-neutral-500 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                            {mod.optionName || mod.name}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* 🚨 Kitchen Critical Notes */}
                    {item.notes && (
                      <div className="mt-2 ml-6 flex items-start gap-2 bg-red-50 border-l-4 border-red-500 p-2 rounded-r-md">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-red-800 uppercase tracking-wide">{item.notes}</p>
                      </div>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-neutral-900 shrink-0">
                    Rs. {(item.subtotal ?? 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="border-t border-neutral-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-neutral-600">
              <span>Subtotal</span>
              <span>Rs. {(order.subtotal ?? order.total ?? 0).toLocaleString()}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Delivery Fee</span>
                <span>Rs. {order.deliveryFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-neutral-100">
              <span className="text-base font-bold text-neutral-900">Total</span>
              <span className="text-xl font-bold text-[#1B2333]">Rs. {(order.total || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Order-Level Notes */}
          {order.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 uppercase">Delivery Instructions</p>
                <p className="text-sm text-amber-900 mt-1">{order.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Reprint Renderer */}
      {isReprinting && (
        <div className="fixed inset-0 z-[9999] bg-white/90 flex items-center justify-center print:static print:z-auto print:bg-white">
          <div className="print:hidden absolute top-4 right-4">
            <button onClick={() => setIsReprinting(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-lg">
              Cancel Print
            </button>
          </div>
          <ThermalReceipt order={order} />
        </div>
      )}

       {isPrintingKitchen && (
        <div className="fixed inset-0 z-[9999] bg-white/90 flex items-center justify-center print:static print:z-auto print:bg-white">
          <div className="print:hidden absolute top-4 right-4">
            <button onClick={() => setIsPrintingKitchen(false)} className="px-4 py-2 bg-red-600 text-white rounded">Cancel</button>
          </div>
          <KitchenTicket order={order} />
        </div>
      )}
    </div>
  );
}