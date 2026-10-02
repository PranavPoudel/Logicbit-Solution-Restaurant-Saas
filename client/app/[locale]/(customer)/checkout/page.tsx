// app/[locale]/(customer)/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { checkout } from "@/lib/api/orders";
import { checkDeliveryAvailability } from "@/lib/api/discovery";
import { AlertCircle, Loader2, ShoppingBag, MapPin, Tag, Navigation } from "lucide-react";
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
  const router = useRouter();

  const { items, restaurantId, subtotal, clear } = useCartStore();

  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  
  // Dynamic delivery fee states (from main)
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [deliveryCheckLoading, setDeliveryCheckLoading] = useState(false);
  const [notDeliverable, setNotDeliverable] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false); // Added to prevent crash in handleGetLocation

  const sub = subtotal();
  const effectiveDeliveryFee = deliveryFee ?? 0;
  const total = sub + (orderType === "DELIVERY" ? effectiveDeliveryFee : 0);

  // Derived state to keep the DeliveryLocationPicker happy
  const selectedLocation =
    deliveryLatitude != null && deliveryLongitude != null
      ? { latitude: deliveryLatitude, longitude: deliveryLongitude }
      : null;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryLatitude(position.coords.latitude);
        setDeliveryLongitude(position.coords.longitude);
        setIsGettingLocation(false);
        if (!deliveryAddress.trim()) {
          setDeliveryAddress(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
        }
      },
      () => {
        setIsGettingLocation(false);
        setError("Unable to retrieve your location.");
      }
    );
  };

  const handleLocationChange = (location: { latitude: number; longitude: number }) => {
    setDeliveryLatitude(location.latitude);
    setDeliveryLongitude(location.longitude);
    setError("");
  };

  // Distance-based delivery fee: fetches the real fee once we have the customer's location
  useEffect(() => {
    if (orderType !== "DELIVERY" || !restaurantId || deliveryLatitude == null || deliveryLongitude == null) {
      return;
    }
    setDeliveryCheckLoading(true);
    setNotDeliverable(false);
    checkDeliveryAvailability(restaurantId, deliveryLatitude, deliveryLongitude)
      .then((res: any) => {
        const data = res?.data ?? res;
        if (data?.deliverable === false) {
          setNotDeliverable(true);
          setDeliveryFee(null);
        } else {
          setDeliveryFee(typeof data?.deliveryFee === "number" ? data.deliveryFee : 60);
          setDistanceKm(typeof data?.distanceKm === "number" ? data.distanceKm : null);
        }
      })
      .catch(() => {
        setDeliveryFee(60);
        setDistanceKm(null);
      })
      .finally(() => setDeliveryCheckLoading(false));
  }, [orderType, restaurantId, deliveryLatitude, deliveryLongitude]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!restaurantId) throw new Error("Restaurant ID is missing.");
      if (items.length === 0) throw new Error("Cart is empty.");

      if (orderType === "DELIVERY") {
        if (deliveryLatitude == null || deliveryLongitude == null) {
          throw new Error("Please select your delivery location on the map.");
        }
        if (!deliveryAddress.trim()) {
          throw new Error("Please enter your delivery address.");
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
        ...(couponCode.trim() ? { couponCode: couponCode.trim().toUpperCase() } : {}),
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedModifiers: item.selectedModifiers?.map((m) => ({
            modifierGroupId: m.modifierGroupId,
            modifierOptionId: m.modifierOptionId,
          })) || [],
        })),
      };

      return checkout(payload);
    },

    onSuccess: (data) => {
      clear();
      const orderId = data?.id || data?.orderId; 
      router.push(`/account/orders/${orderId}`); 
    },

    onError: (err: any) => {
      console.error("Checkout failed:", err);
      const rawMessage = err?.response?.data?.message || err?.message || t("genericError");
      const errorMessage = typeof rawMessage === "string" ? rawMessage : JSON.stringify(rawMessage);
      setError(errorMessage);

      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError(t("errors.emptyCart") || "Cart is empty.");
      return;
    }
    if (!restaurantId) {
      setError("Restaurant ID is missing.");
      return;
    }
    if (orderType === "DELIVERY") {
      if (deliveryLatitude == null || deliveryLongitude == null) {
        setError("Please click on the map to select your delivery location.");
        return;
      }
      if (!deliveryAddress.trim()) {
        setError("Please enter your delivery address.");
        return;
      }
    }

    mutation.mutate();
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 text-neutral-300" size={48} />
        <h1 className="font-display text-xl font-semibold text-[#17181C]">{t("emptyTitle")}</h1>
        <p className="mt-1.5 mb-6 text-sm text-neutral-500">{t("emptyDesc")}</p>
        <Link href="/" className="inline-block rounded-full bg-[#17181C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2B2D33]">
          {t("browseRestaurants")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-[#17181C]">{t("title")}</h1>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* ORDER TYPE */}
          <div className="flex gap-1 rounded-2xl border border-[#E8E7E2] bg-white p-1">
            {(["DELIVERY", "PICKUP"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setOrderType(type);
                  setError(""); // Kept from your branch: good UX to clear errors on tab switch
                }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  orderType === type
                    ? "bg-[#17181C] text-white shadow-sm"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {type === "DELIVERY" ? t("delivery") : t("pickup")}
              </button>
            ))}
          </div>

          {/* DELIVERY ADDRESS & MAP */}
          {orderType === "DELIVERY" && (
            <div className="rounded-2xl border border-[#E8E7E2] bg-white p-6">
              <h2 className="mb-4 font-semibold text-[#17181C]">{t("deliveryAddress")}</h2>

              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-neutral-400" />
                <textarea
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={t("placeholders.address")}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#E8E7E2] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/40"
                />
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-medium text-[#17181C]">Select delivery location</p>
                <DeliveryLocationPicker
                  value={selectedLocation}
                  onChange={handleLocationChange}
                />
                
                {/* Merged UX: Show not deliverable warning AND coordinate confirmation */}
                {notDeliverable && (
                  <p className="text-xs text-red-600 mt-3">
                    This restaurant doesn't deliver to your current location.
                  </p>
                )}
                {!notDeliverable && selectedLocation && (
                  <p className="text-xs text-amber-600 mt-3">
                    Delivery pin selected: Lat {selectedLocation.latitude.toFixed(4)}, Lng {selectedLocation.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* COUPON */}
          <div className="rounded-2xl border border-[#E8E7E2] bg-white p-6">
            <h2 className="mb-4 font-semibold text-[#17181C]">{t("couponCode")}</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t("placeholders.coupon")}
                  className="w-full rounded-xl border border-[#E8E7E2] py-2.5 pl-10 pr-4 text-sm uppercase outline-none focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/40"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!couponCode.trim()) {
                    setError("Please enter a coupon code first.");
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
              * Coupon validity will be verified when you place your order.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN (ORDER SUMMARY) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-[#E8E7E2] bg-white p-5">
            <h2 className="border-b border-[#E8E7E2] pb-3 font-semibold text-[#17181C]">
              {t("orderSummary")}
            </h2>

            <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.menuItemId}-${item.variantKey}`} className="flex justify-between text-sm">
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-[#17181C]">{item.quantity}x {item.name}</p>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-neutral-400">
                        {item.selectedModifiers.map((modifier) => modifier.optionName).join(", ")}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 font-mono text-neutral-600">Rs {item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-[#E8E7E2] pt-3 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>{t("subtotal")}</span>
                <span className="font-mono">Rs {sub}</span>
              </div>

              {orderType === "DELIVERY" && (
                <div className="flex justify-between text-neutral-500">
                  <span>
                    {t("deliveryFee")}
                    {distanceKm != null && (
                      <span className="text-neutral-400"> ({distanceKm.toFixed(1)} km)</span>
                    )}
                  </span>
                  <span className="font-mono">
                    {deliveryCheckLoading ? "…" : `Rs ${effectiveDeliveryFee}`}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-[#E8E7E2] pt-2 font-semibold text-[#17181C]">
                <span>{t("total")}</span>
                <span className="font-mono text-lg">Rs {total}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                mutation.isPending ||
                (orderType === "DELIVERY" && (!deliveryAddress.trim() || notDeliverable || deliveryCheckLoading))
              }
              className="w-full bg-[#17181C] text-white text-sm font-medium py-3.5 rounded-xl hover:bg-[#2B2D33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
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