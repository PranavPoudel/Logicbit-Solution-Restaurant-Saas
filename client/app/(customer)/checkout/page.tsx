// app/(customer)/checkout/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCartStore } from "@/store/cart-store";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { checkout, type CheckoutInput } from "@/lib/api/orders";
import { customerGuestCheckout } from "@/lib/api/customer-auth";
import { useGeolocation } from "@/hooks/use-geolocation";

const DELIVERY_FEE = 60; // TODO: replace with the distance-tiered fee once confirmed

type OrderType = "DELIVERY" | "PICKUP" | "DINE_IN";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, restaurantId, subtotal, clear } = useCartStore();
  const { isAuthenticated, setAuth } = useCustomerAuthStore();
  const { lat, lng } = useGeolocation();

  const [address, setAddress] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("DELIVERY");
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const sub = subtotal();
  const total = sub + (orderType === "DELIVERY" ? DELIVERY_FEE : 0);

  const mutation = useMutation({
    mutationFn: (input: CheckoutInput) => checkout(input),
    onSuccess: (data) => {
      clear();
      // TODO: confirm the exact field the backend returns for the new
      // order's id (assumed `id`).
      const orderId = data?.id ?? data?.orderId;
      router.push(orderId ? `/orders/${orderId}` : "/");
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
        // Guest sessions may not include a full customer profile —
        // fall back to a placeholder so the auth store stays consistent.
        customer: data.customer ?? { id: "guest", fullName: "Guest", email: "" },
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
    });
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-sm text-neutral-500">Your cart is empty.</p>
        <Link
          href="/"
          className="inline-block mt-4 text-sm font-medium bg-[#17181C] text-white px-5 py-2.5 rounded-full"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <h1 className="font-display font-semibold text-xl text-[#17181C]">
          Log in to check out
        </h1>
        <p className="text-sm text-neutral-500 mt-1.5 mb-6">
          Or continue without an account — you can still track this order.
        </p>
        <div className="space-y-2.5">
          <Link
            href="/login"
            className="block w-full bg-[#17181C] text-white text-sm font-medium py-2.5 rounded-xl"
          >
            Log in
          </Link>
          <button
            onClick={continueAsGuest}
            disabled={guestLoading}
            className="block w-full border border-[#E8E7E2] text-[#17181C] text-sm font-medium py-2.5 rounded-xl disabled:opacity-60"
          >
            {guestLoading ? "Starting…" : "Continue as guest"}
          </button>
        </div>
        {guestError && <p className="text-xs text-red-600 mt-3">{guestError}</p>}
      </div>
    );
  }

  const checkoutErrorMessage = isAxiosError(mutation.error)
    ? mutation.error.response?.data?.message ?? "Couldn't place the order. Please try again."
    : mutation.isError
      ? "Couldn't place the order. Please try again."
      : null;

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
                orderType === type
                  ? "bg-[#17181C] text-white border-[#17181C]"
                  : "bg-white text-neutral-500 border-[#E8E7E2]"
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
        </div>
      )}

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4">
        <p className="text-sm font-medium text-[#17181C] mb-2">Payment</p>
        <p className="text-sm text-neutral-500">Cash on Delivery</p>
      </div>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span className="font-mono">Rs {sub}</span>
        </div>
        {orderType === "DELIVERY" && (
          <div className="flex justify-between text-neutral-500">
            <span>Delivery fee</span>
            <span className="font-mono">Rs {DELIVERY_FEE}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-[#17181C] pt-2 border-t border-[#E8E7E2]">
          <span>Total</span>
          <span className="font-mono">Rs {total}</span>
        </div>
      </div>

      {checkoutErrorMessage && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4">
          {typeof checkoutErrorMessage === "string"
            ? checkoutErrorMessage
            : "Couldn't place the order. Please try again."}
        </p>
      )}

      <button
        onClick={placeOrder}
        disabled={mutation.isPending || (orderType === "DELIVERY" && !address)}
        className="w-full mt-5 bg-[#17181C] text-white text-sm font-medium py-3.5 rounded-2xl disabled:opacity-50"
      >
        {mutation.isPending ? "Placing order…" : `Place order — Rs ${total}`}
      </button>
    </div>
  );
}
