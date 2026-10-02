// app/[locale]/(customer)/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { checkout } from "@/lib/api/orders";
import { checkDeliveryAvailability } from "@/lib/api/discovery";
import { AlertCircle, Loader2, ShoppingBag, MapPin, Tag, Navigation } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items, restaurantId, subtotal, clear } = useCartStore();
  
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | undefined>(undefined);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | undefined>(undefined);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [deliveryCheckLoading, setDeliveryCheckLoading] = useState(false);
  const [notDeliverable, setNotDeliverable] = useState(false);

  const sub = subtotal();
  const effectiveDeliveryFee = deliveryFee ?? 0;
  const total = sub + (orderType === "DELIVERY" ? effectiveDeliveryFee : 0);

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
      (err) => {
        console.error("Geolocation error:", err);
        setError("Unable to retrieve your location. Please enter your address manually.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
      const payload = {
        restaurantId: restaurantId!,
        orderType,
        paymentMethod: "COD" as const,
        ...(orderType === "DELIVERY" ? {
          deliveryAddress,
          deliveryLatitude,
          deliveryLongitude,
        } : {}),
        ...(couponCode.trim() ? { couponCode: couponCode.trim().toUpperCase() } : {}),
        items: items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedModifiers: item.selectedModifiers?.map(m => ({
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
      const rawMessage = err?.response?.data?.message || t("genericError");
      const errorMessage = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (orderType === "DELIVERY" && !deliveryAddress.trim()) {
      return setError(t("errors.addressRequired") || "Delivery address is required.");
    }
    if (items.length === 0) return setError(t("errors.emptyCart") || "Cart is empty.");

    mutation.mutate();
  };

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto text-neutral-300 mb-4" size={48} />
        <h1 className="font-display font-semibold text-xl text-[#17181C]">{t("emptyTitle")}</h1>
        <p className="text-sm text-neutral-500 mt-1.5 mb-6">{t("emptyDesc")}</p>
        <Link href="/" className="inline-block bg-[#17181C] text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#2B2D33] transition-colors">
          {t("browseRestaurants")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display font-semibold text-2xl text-[#17181C] mb-6">{t("title")}</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-[#E8E7E2] rounded-2xl p-1 flex gap-1">
            {(["DELIVERY", "PICKUP"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  orderType === type
                    ? "bg-[#17181C] text-white shadow-sm"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {type === "DELIVERY" ? t("delivery") : t("pickup")}
              </button>
            ))}
          </div>

          {orderType === "DELIVERY" && (
            <div className="bg-white border border-[#E8E7E2] rounded-2xl p-6">
              <h2 className="font-semibold text-[#17181C] mb-4">{t("deliveryAddress")}</h2>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-neutral-400" />
                <textarea
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder={t("placeholders.address")}
                  rows={2}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-[#E8E7E2] rounded-xl focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  className="absolute right-2 top-2 p-1.5 text-neutral-400 hover:text-[#E3A008] transition-colors rounded-lg hover:bg-neutral-50"
                  title="Use current location"
                >
                  {isGettingLocation ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                </button>
              </div>
              {notDeliverable && (
                <p className="text-xs text-red-600 mt-2">
                  This restaurant doesn't deliver to your current location.
                </p>
              )}
            </div>
          )}

          <div className="bg-white border border-[#E8E7E2] rounded-2xl p-6">
            <h2 className="font-semibold text-[#17181C] mb-4">{t("couponCode")}</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t("placeholders.coupon")}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E8E7E2] rounded-xl focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none uppercase"
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
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#17181C] rounded-xl hover:bg-[#2B2D33] transition-colors"
              >
                {t("apply")}
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              * Coupon validity will be verified when you place your order.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E8E7E2] rounded-2xl p-5 sticky top-24 space-y-4">
            <h2 className="font-semibold text-[#17181C] border-b border-[#E8E7E2] pb-3">{t("orderSummary")}</h2>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.menuItemId}-${item.variantKey}`} className="flex justify-between text-sm">
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-[#17181C]">{item.quantity}x {item.name}</p>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {item.selectedModifiers.map(m => m.optionName).join(", ")}
                      </p>
                    )}
                  </div>
                  <p className="font-mono text-neutral-600 shrink-0">Rs {item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E8E7E2] pt-3 space-y-2 text-sm">
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
              <div className="flex justify-between font-semibold text-[#17181C] pt-2 border-t border-[#E8E7E2]">
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