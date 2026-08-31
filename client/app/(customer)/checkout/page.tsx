"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { checkout, type CheckoutInput } from "@/lib/api/orders";
import { customerGuestCheckout } from "@/lib/api/customer-auth";
import { validateCoupon } from "@/lib/api/coupons";
import { checkDeliveryAvailability } from "@/lib/api/discovery";
import { useGeolocation } from "@/hooks/use-geolocation";

type OrderType = "DELIVERY" | "PICKUP" | "DINE_IN";

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, restaurantId, subtotal, clear } = useCartStore();
  const { isAuthenticated, setAuth } = useCustomerAuthStore();
  const { lat, lng, isResolved } = useGeolocation();

  const [address, setAddress] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("DELIVERY");
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const sub = subtotal();
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const discountedSubtotal = Math.max(0, sub - discountAmount);

  const deliveryQuery = useQuery({
    queryKey: ["delivery-check", restaurantId, lat, lng],
    queryFn: () => checkDeliveryAvailability(restaurantId as string, lat, lng),
    enabled: orderType === "DELIVERY" && isResolved && !!restaurantId && !!lat && !!lng,
  });

  // Use the backend-calculated fee for the UI estimate, fallback to 0 if loading
  const displayDeliveryFee = orderType === "DELIVERY" ? (deliveryQuery.data?.deliveryFee ?? 0) : 0;
  const total = discountedSubtotal + displayDeliveryFee;

  const mutation = useMutation({
    mutationFn: (input: CheckoutInput) => checkout(input),
    onSuccess: (data) => {
      clear();
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      const orderId = data?.id ?? data?.orderId;
      router.push(orderId ? `/orders/${orderId}` : "/");
    },
  });

  const validateCouponMutation = useMutation({
    mutationFn: () => 
      validateCoupon({ 
        restaurantId: restaurantId as string, 
        code: couponCode.trim().toUpperCase(), 
        subtotal: sub 
      }),
    onSuccess: (data) => {
      // Backend returns { coupon, discountAmount } on success
      if (data?.discountAmount !== undefined) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountAmount: data.discountAmount,
          message: "Coupon applied successfully!",
        });
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError("Invalid coupon code.");
      }
    },
    onError: (error: any) => {
      setAppliedCoupon(null);
      // Backend throws BadRequestException/NotFoundException with a specific message
      const errorMsg = error?.response?.data?.message || "Failed to validate coupon.";
      setCouponError(errorMsg);
    },
  });

  async function continueAsGuest() {
    setGuestLoading(true);
    setGuestError(null);
    try {
      const data = await customerGuestCheckout();
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? "",
        customer: data.customer ?? { id: "guest", name: "Guest", email: "" },
      });
    } catch {
      setGuestError("Couldn't start guest checkout. Please try logging in instead.");
    } finally {
      setGuestLoading(false);
    }
  }

  function placeOrder() {
    if (!restaurantId) return;
    mutation.mutate({
      restaurantId,
      items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      orderType,
      paymentMethod: "CASH_ON_DELIVERY",
      deliveryAddress: orderType === "DELIVERY" ? address : undefined,
      deliveryLat: orderType === "DELIVERY" ? lat : undefined,
      deliveryLng: orderType === "DELIVERY" ? lng : undefined,
      couponCode: appliedCoupon?.code || undefined,
    });
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-sm text-neutral-500">Your cart is empty.</p>
        <Link href="/" className="inline-block mt-4 text-sm font-medium bg-[#17181C] text-white px-5 py-2.5 rounded-full">
          Browse restaurants
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-semibold text-xl text-[#17181C]">Log in to check out</h1>
        <p className="text-sm text-neutral-500 mt-1.5 mb-6">Or continue without an account — you can still track this order.</p>
        <div className="space-y-2.5">
          <Link href="/login" className="block w-full bg-[#17181C] text-white text-sm font-medium py-2.5 rounded-xl">Log in</Link>
          <button onClick={continueAsGuest} disabled={guestLoading} className="block w-full border border-[#E8E7E2] text-[#17181C] text-sm font-medium py-2.5 rounded-xl disabled:opacity-60">
            {guestLoading ? "Starting…" : "Continue as guest"}
          </button>
        </div>
        {guestError && <p className="text-xs text-red-600 mt-3">{guestError}</p>}
      </div>
    );
  }

  const checkoutErrorMessage = isAxiosError(mutation.error)
    ? mutation.error.response?.data?.message ?? "Couldn't place the order. Please try again."
    : mutation.isError ? "Couldn't place the order. Please try again." : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="font-display font-semibold text-xl text-[#17181C] mb-5">Checkout</h1>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4">
        <p className="text-sm font-medium text-[#17181C] mb-2.5">Order type</p>
        <div className="flex gap-2">
          {(["DELIVERY", "PICKUP", "DINE_IN"] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 text-xs font-medium py-2.5 rounded-xl border transition-colors ${
                orderType === type ? "bg-[#17181C] text-white border-[#17181C]" : "bg-white text-neutral-500 border-[#E8E7E2]"
              }`}
            >
              {type === "DELIVERY" ? "Delivery" : type === "PICKUP" ? "Pickup" : "Dine in"}
            </button>
          ))}
        </div>
      </div>

      {orderType === "DELIVERY" && (
        <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4">
          <p className="text-sm font-medium text-[#17181C] mb-2.5">Delivery address</p>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House number, street, landmark…"
            rows={2}
            className="w-full bg-[#FAFAF7] border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
          />
          {!isResolved && (
            <p className="text-xs text-[#E3A008] mt-2 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Getting your location for accurate delivery fee...
            </p>
          )}
        </div>
      )}

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4">
        <p className="text-sm font-medium text-[#17181C] mb-2">Payment</p>
        <p className="text-sm text-neutral-500">Cash on Delivery</p>
      </div>

      {/* Coupon Input Section */}
      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4">
        <p className="text-sm font-medium text-[#17181C] mb-2.5">Have a coupon?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
            placeholder="Enter code (e.g., WEL100)"
            disabled={!!appliedCoupon || validateCouponMutation.isPending}
            className="flex-1 bg-[#FAFAF7] border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] disabled:opacity-50"
          />
          {appliedCoupon ? (
            <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1">
              <XCircle size={16} /> Remove
            </button>
          ) : (
            <button onClick={() => validateCouponMutation.mutate()} disabled={!couponCode.trim() || validateCouponMutation.isPending} className="px-4 py-2.5 bg-[#17181C] text-white text-sm font-medium rounded-xl disabled:opacity-50 flex items-center gap-1">
              {validateCouponMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
            </button>
          )}
        </div>
        {appliedCoupon && (
          <div className="mt-3 flex items-start gap-2 text-sm text-[#0F6B5C] bg-[#0F6B5C]/5 p-3 rounded-lg border border-[#0F6B5C]/20">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{appliedCoupon.message}</p>
              <p className="text-xs opacity-80">You saved Rs {discountAmount}!</p>
            </div>
          </div>
        )}
        {couponError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
            <XCircle size={16} className="shrink-0" />
            <p>{couponError}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span className="font-mono">Rs {sub}</span>
        </div>
        
        {discountAmount > 0 && (
          <div className="flex justify-between text-[#0F6B5C]">
            <span>Discount ({appliedCoupon.code})</span>
            <span className="font-mono">- Rs {discountAmount}</span>
          </div>
        )}

        {orderType === "DELIVERY" && (
          <div className="flex justify-between text-neutral-500">
            <span className="flex items-center gap-1">
              Delivery fee (estimate)
              {deliveryQuery.isLoading && <Loader2 size={12} className="animate-spin" />}
            </span>
            <span className="font-mono">
              {deliveryQuery.isLoading ? "..." : `Rs ${displayDeliveryFee}`}
            </span>
          </div>
        )}
        
        <div className="flex justify-between font-semibold text-[#17181C] pt-2 border-t border-[#E8E7E2]">
          <span>Total</span>
          <span className="font-mono">Rs {total}</span>
        </div>
      </div>

      {checkoutErrorMessage && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4">
          {typeof checkoutErrorMessage === "string" ? checkoutErrorMessage : "Couldn't place the order. Please try again."}
        </p>
      )}

      <button
        onClick={placeOrder}
        disabled={mutation.isPending || (orderType === "DELIVERY" && (!address || deliveryQuery.isLoading))}
        className="w-full mt-5 bg-[#17181C] text-white text-sm font-medium py-3.5 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {mutation.isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Placing order…</>
        ) : (
          `Place order — Rs ${total}`
        )}
      </button>
    </div>
  );
}