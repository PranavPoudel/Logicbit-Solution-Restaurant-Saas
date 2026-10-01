
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { checkout } from "@/lib/api/orders";
import {
  AlertCircle,
  Loader2,
  ShoppingBag,
  MapPin,
  Tag,
} from "lucide-react";
import Link from "next/link";

const DeliveryLocationPicker = dynamic(
  () => import("@/components/customer/delivery-location-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-[#E8E7E2] bg-neutral-50 text-sm text-neutral-500">
        Loading map...
      </div>
    ),
  }
);

export default function CheckoutPage() {
  const t = useTranslations("checkout");

  const { items, restaurantId, subtotal, clear } = useCartStore();

  const [orderType, setOrderType] =
    useState<"DELIVERY" | "PICKUP">("DELIVERY");

  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [deliveryLatitude, setDeliveryLatitude] = useState<
    number | null
  >(null);

  const [deliveryLongitude, setDeliveryLongitude] = useState<
    number | null
  >(null);

  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");

  const sub = subtotal();
  const deliveryFee = orderType === "DELIVERY" ? 50 : 0;
  const total = sub + deliveryFee;

  const selectedLocation =
    deliveryLatitude != null &&
    deliveryLongitude != null
      ? {
          latitude: deliveryLatitude,
          longitude: deliveryLongitude,
        }
      : null;

  const handleLocationChange = (location: {
    latitude: number;
    longitude: number;
  }) => {
    setDeliveryLatitude(location.latitude);
    setDeliveryLongitude(location.longitude);
    setError("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId) {
        throw new Error("Restaurant ID is missing.");
      }

      if (items.length === 0) {
        throw new Error("Cart is empty.");
      }

      if (orderType === "DELIVERY") {
        if (
          deliveryLatitude == null ||
          deliveryLongitude == null
        ) {
          throw new Error(
            "Please select your delivery location on the map."
          );
        }

        if (!deliveryAddress.trim()) {
          throw new Error(
            "Please enter your delivery address."
          );
        }
      }

      const payload = {
        restaurantId,
        orderType,
        paymentMethod: "COD" as const,

        ...(orderType === "DELIVERY"
          ? {
              deliveryAddress: deliveryAddress.trim(),
              deliveryLatitude: deliveryLatitude ?? undefined,
              deliveryLongitude: deliveryLongitude ?? undefined,
            }
          : {}),

        ...(couponCode.trim()
          ? {
              couponCode: couponCode.trim().toUpperCase(),
            }
          : {}),

        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedModifiers:
            item.selectedModifiers?.map((modifier) => ({
              modifierGroupId: modifier.modifierGroupId,
              modifierOptionId: modifier.modifierOptionId,
            })) || [],
        })),
      };

      console.log(
        "Creating order with delivery information:",
        {
          orderType,
          deliveryAddress:
            orderType === "DELIVERY"
              ? payload.deliveryAddress
              : undefined,
          deliveryLatitude:
            orderType === "DELIVERY"
              ? (payload.deliveryLatitude ?? undefined)
              : undefined,
          deliveryLongitude:
            orderType === "DELIVERY"
              ? (payload.deliveryLongitude ?? undefined)
              : undefined,
        }
      );

      return checkout(payload);
    },

    onSuccess: (data) => {
      const orderId = data?.id || data?.orderId;

      if (!orderId) {
        console.error(
          "Checkout succeeded but no order ID was returned:",
          data
        );

        setError(
          "Order was created, but no order ID was returned."
        );

        return;
      }

      clear();

      const pathParts = window.location.pathname
        .split("/")
        .filter(Boolean);

      const locale = pathParts[0] || "en";

      const orderUrl = `/${locale}/orders/${orderId}`;

      console.log("Checkout successful.");
      console.log("Order ID:", orderId);
      console.log("Redirecting to:", orderUrl);

      window.location.assign(orderUrl);
    },

    onError: (err: any) => {
      console.error("Checkout failed:", err);

      const rawMessage =
        err?.response?.data?.message ||
        err?.message ||
        t("genericError");

      const errorMessage =
        typeof rawMessage === "string"
          ? rawMessage
          : JSON.stringify(rawMessage);

      setError(errorMessage);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (items.length === 0) {
      setError(
        t("errors.emptyCart") || "Cart is empty."
      );
      return;
    }

    if (!restaurantId) {
      setError("Restaurant ID is missing.");
      return;
    }

    if (orderType === "DELIVERY") {
      if (
        deliveryLatitude == null ||
        deliveryLongitude == null
      ) {
        setError(
          "Please click on the map to select your delivery location."
        );

        return;
      }

      if (!deliveryAddress.trim()) {
        setError(
          "Please enter your delivery address."
        );

        return;
      }
    }

    mutation.mutate();
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBag
          className="mx-auto mb-4 text-neutral-300"
          size={48}
        />

        <h1 className="font-display text-xl font-semibold text-[#17181C]">
          {t("emptyTitle")}
        </h1>

        <p className="mt-1.5 mb-6 text-sm text-neutral-500">
          {t("emptyDesc")}
        </p>

        <Link
          href="/"
          className="inline-block rounded-full bg-[#17181C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2B2D33]"
        >
          {t("browseRestaurants")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-[#17181C]">
        {t("title")}
      </h1>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-8 lg:grid-cols-3"
      >
        {/* LEFT */}
        <div className="space-y-6 lg:col-span-2">
          {/* ORDER TYPE */}
          <div className="flex gap-1 rounded-2xl border border-[#E8E7E2] bg-white p-1">
            {(["DELIVERY", "PICKUP"] as const).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setOrderType(type);
                    setError("");
                  }}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                    orderType === type
                      ? "bg-[#17181C] text-white shadow-sm"
                      : "text-neutral-500 hover:bg-neutral-50"
                  }`}
                >
                  {type === "DELIVERY"
                    ? t("delivery")
                    : t("pickup")}
                </button>
              )
            )}
          </div>

          {/* DELIVERY */}
          {orderType === "DELIVERY" && (
            <div className="rounded-2xl border border-[#E8E7E2] bg-white p-6">
              <h2 className="mb-4 font-semibold text-[#17181C]">
                {t("deliveryAddress")}
              </h2>

              {/* ADDRESS */}
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3 top-3 text-neutral-400"
                />

                <textarea
                  required
                  value={deliveryAddress}
                  onChange={(e) =>
                    setDeliveryAddress(e.target.value)
                  }
                  placeholder={t(
                    "placeholders.address"
                  )}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#E8E7E2] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/40"
                />
              </div>

              {/* MAP */}
              <div className="mt-5">
                <p className="mb-3 text-sm font-medium text-[#17181C]">
                  Select delivery location
                </p>

                <DeliveryLocationPicker
                  value={selectedLocation}
                  onChange={handleLocationChange}
                />
              </div>

              {/* SELECTED COORDINATES */}
              {selectedLocation && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-sm font-semibold text-green-700">
                    Delivery pin selected
                  </p>

                  <p className="mt-1 font-mono text-xs text-green-700">
                    Latitude:{" "}
                    {selectedLocation.latitude.toFixed(6)}
                    <br />
                    Longitude:{" "}
                    {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              )}

              {!selectedLocation && (
                <p className="mt-3 text-xs text-amber-600">
                  Click anywhere on the map to place the
                  delivery pin.
                </p>
              )}
            </div>
          )}

          {/* COUPON */}
          <div className="rounded-2xl border border-[#E8E7E2] bg-white p-6">
            <h2 className="mb-4 font-semibold text-[#17181C]">
              {t("couponCode")}
            </h2>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Tag
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) =>
                    setCouponCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder={t(
                    "placeholders.coupon"
                  )}
                  className="w-full rounded-xl border border-[#E8E7E2] py-2.5 pl-10 pr-4 text-sm uppercase outline-none focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/40"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!couponCode.trim()) {
                    setError(
                      "Please enter a coupon code first."
                    );
                    return;
                  }

                  setError("");
                }}
                className="rounded-xl bg-[#17181C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2B2D33]"
              >
                {t("apply")}
              </button>
            </div>

            <p className="mt-2 text-xs text-neutral-400">
              * Coupon validity will be verified when you
              place your order.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-[#E8E7E2] bg-white p-5">
            <h2 className="border-b border-[#E8E7E2] pb-3 font-semibold text-[#17181C]">
              {t("orderSummary")}
            </h2>

            <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.menuItemId}-${item.variantKey}`}
                  className="flex justify-between text-sm"
                >
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-[#17181C]">
                      {item.quantity}x {item.name}
                    </p>

                    {item.selectedModifiers &&
                      item.selectedModifiers.length > 0 && (
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          {item.selectedModifiers
                            .map(
                              (modifier) =>
                                modifier.optionName
                            )
                            .join(", ")}
                        </p>
                      )}
                  </div>

                  <p className="shrink-0 font-mono text-neutral-600">
                    Rs {item.price * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-[#E8E7E2] pt-3 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>{t("subtotal")}</span>

                <span className="font-mono">
                  Rs {sub}
                </span>
              </div>

              {orderType === "DELIVERY" && (
                <div className="flex justify-between text-neutral-500">
                  <span>{t("deliveryFee")}</span>

                  <span className="font-mono">
                    Rs {deliveryFee}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-[#E8E7E2] pt-2 font-semibold text-[#17181C]">
                <span>{t("total")}</span>

                <span className="font-mono text-lg">
                  Rs {total}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17181C] py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#2B2D33] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  {t("processing")}
                </>
              ) : (
                `${t("placeOrder")} — Rs ${total}`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
