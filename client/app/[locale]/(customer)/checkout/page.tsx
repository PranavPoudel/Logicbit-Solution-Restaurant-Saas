"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { checkout } from "@/lib/api/orders";
import { AddressPicker } from "@/components/map/address-picker";
import { PaymentModal, type PaymentMethod } from "@/components/checkout/payment-modal";
import { checkDeliveryAvailability, getPublicRestaurant } from "@/lib/api/discovery";
import { AlertCircle, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { getErrorMessage } from "@/lib/utils/error";
import { useRedirectToLogin } from "@/hooks/use-require-login";
import { CouponBox } from "@/components/cart/coupon-input";
import { AllergenNote } from "@/components/cart/allergen-note";
import { DiscountRow } from "@/components/cart/discount-row";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const isLoggedIn = useRedirectToLogin();

  const { items, subtotal, activeRestaurantId, clear, coupon } = useCartStore();
  const discount = useCartStore((s) => s.discount());
  const restaurantId = activeRestaurantId();

  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const isPickup = orderType === "PICKUP";
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  const sub = subtotal();

  const hasLocation = orderType === "DELIVERY" && !!restaurantId && deliveryLatitude != null && deliveryLongitude != null;
  const deliveryQuery = useQuery({
    queryKey: ["delivery-check", restaurantId, deliveryLatitude, deliveryLongitude],
    queryFn: () => checkDeliveryAvailability(restaurantId as string, deliveryLatitude as number, deliveryLongitude as number),
    enabled: hasLocation,
    retry: false,
  });

  const restaurantSettingsQuery = useQuery({
    queryKey: ["public-restaurant-settings", restaurantId],
    queryFn: () => getPublicRestaurant(restaurantId as string),
    enabled: !!restaurantId,
  });

   // Compute the list of enabled methods based on restaurant settings
  const enabledMethods = useMemo(() => {
    const r = restaurantSettingsQuery.data as any;
    if (!r) return ["COD"] as PaymentMethod[]; // Safe fallback while loading

    const methods: PaymentMethod[] = [];
    if (r.supportsCod) methods.push("COD");
    if (r.supportsCreditCard) methods.push("CREDIT_CARD");
    if (r.supportsEsewa) methods.push("ESEWA");
    if (r.supportsKhalti) methods.push("KHALTI");
    if (r.supportsIps) methods.push("IPS");
    if (r.supportsPhonePay) methods.push("PHONEPAY");
    if (r.supportsPaypay) methods.push("PAYPAY");
    
    // Always ensure at least one method is available (fallback to COD)
    return methods.length > 0 ? methods : (["COD"] as PaymentMethod[]);
  }, [restaurantSettingsQuery.data]);

  type DeliveryCheck = { deliverable?: boolean; deliveryFee?: number; distanceKm?: number };
  const checkResult = deliveryQuery.data as (DeliveryCheck & { data?: DeliveryCheck }) | undefined;
  const deliveryData: DeliveryCheck | undefined = checkResult?.data ?? checkResult;
  const deliveryCheckLoading = hasLocation && deliveryQuery.isFetching;
  const notDeliverable = hasLocation && deliveryData?.deliverable === false;
  const distanceKm: number | null =
    hasLocation && typeof deliveryData?.distanceKm === "number" ? deliveryData.distanceKm : null;
  const deliveryFee: number | null =
    hasLocation && !notDeliverable && typeof deliveryData?.deliveryFee === "number" ? deliveryData.deliveryFee : null;
  const feeUnavailable =
    hasLocation && !notDeliverable && !deliveryCheckLoading && (deliveryQuery.isError || (!!deliveryData && deliveryFee === null));
  const effectiveDeliveryFee = deliveryFee ?? 0;
  const total = Math.max(0, sub - discount) + (orderType === "DELIVERY" ? effectiveDeliveryFee : 0);

  const blockedReason = isPickup
    ? ""
    : !deliveryAddress.trim()
      ? "Enter your delivery address to place the order."
      : !hasLocation
        ? "Confirm your pin on the map to place the order."
        : notDeliverable
          ? "This restaurant doesn't deliver to your location."
          : deliveryCheckLoading
            ? "Checking the delivery fee…"
            : feeUnavailable
              ? "Delivery fee unavailable. Retry, or choose pickup."
              : "";

  const mutation = useMutation({
    mutationFn: async (paymentMethod: PaymentMethod) => {
      if (!restaurantId) throw new Error("Restaurant ID is missing.");
      if (items.length === 0) throw new Error(t("errors.emptyCart"));

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
        paymentMethod,
        ...(orderType === "DELIVERY"
          ? {
              deliveryAddress: deliveryAddress.trim(),
              deliveryLatitude: deliveryLatitude ?? undefined,
              deliveryLongitude: deliveryLongitude ?? undefined,
            }
          : {}),
        ...(coupon ? { couponCode: coupon.code } : {}),
        
        // Optional order-level delivery instructions 
        // deliveryInstructions: deliveryInstructions?.trim() || undefined, 

        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          selectedModifiers: item.selectedModifiers?.map((m) => ({
            modifierGroupId: m.modifierGroupId,
            modifierOptionId: m.modifierOptionId,
          })) || [],
          notes: item.notes?.trim() || undefined, // 🆕 CRITICAL: Pass per-item notes to backend
        })),
      };

      return checkout(payload);
    },

    onSuccess: (data) => {
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      clear();
      const orderId = data?.id || data?.orderId; 
      router.push(`/orders/${orderId}`); 
    },

    onError: (err: unknown) => {
      console.error("Checkout failed:", err);
      setError(getErrorMessage(err, t("genericError"), { includeErrorMessage: true }));

      if (!payOpen) window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError(t("errors.emptyCart"));
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
      if (feeUnavailable) {
        setError("We couldn't work out the delivery fee. Please retry, or choose pickup.");
        return;
      }
    }

    setPayOpen(true);
  };

  if (!isLoggedIn) return null;

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

      {error && !payOpen && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ORDER TYPE */}
        <div className="relative mb-6 flex rounded-2xl border border-[#E8E7E2] bg-white p-1 lg:w-[calc((100%-2rem)*2/3)]">
          <span
            aria-hidden
            className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-[#17181C] shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none ${
              isPickup ? "translate-x-full" : ""
            }`}
          />
          {(["DELIVERY", "PICKUP"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setOrderType(type);
                setError(""); // Kept from your branch: good UX to clear errors on tab switch
              }}
              className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors duration-300 ${
                orderType === type ? "text-white" : "text-neutral-500 hover:text-[#17181C]"
              }`}
            >
              {type === "DELIVERY" ? t("delivery") : t("pickup")}
            </button>
          ))}
        </div>

        <div
          className={`grid grid-cols-1 gap-6 transition-[grid-template-columns,column-gap] duration-500 ease-in-out motion-reduce:transition-none ${
            isPickup ? "lg:grid-cols-[0fr_1fr] lg:gap-x-0" : "lg:grid-cols-[2fr_1fr] lg:gap-x-8"
          }`}
        >
          {/* LEFT COLUMN */}
          <div
            inert={isPickup}
            aria-hidden={isPickup}
            className={`min-w-0 overflow-hidden transition-opacity duration-300 motion-reduce:transition-none max-lg:transition-none ${
              isPickup ? "pointer-events-none opacity-0 max-lg:hidden" : "opacity-100"
            }`}
          >
            {/* DELIVERY ADDRESS & MAP */}
            <div className="rounded-2xl border border-[#E8E7E2] bg-white p-6">
              <h2 className="font-semibold text-[#17181C]">{t("deliveryAddress")}</h2>
              <p className="mb-4 mt-1 text-sm text-neutral-500">
                Enter your address, then confirm the pin on the map to see the delivery fee.
              </p>

              <AddressPicker
                value={{ address: deliveryAddress, lat: deliveryLatitude, lng: deliveryLongitude }}
                onChange={({ address, lat, lng }) => {
                  setDeliveryAddress(address);
                  setDeliveryLatitude(lat);
                  setDeliveryLongitude(lng);
                  setError("");
                }}
                onError={setError}
                placeholder={t("placeholders.address")}
                mapLabel="Select delivery location"
              />

              {notDeliverable && (
                <p className="mt-3 text-xs text-red-600">
                  This restaurant doesn&apos;t deliver to your current location.
                </p>
              )}
              {hasLocation && !notDeliverable && (
                <p className="mt-3 text-xs text-neutral-600">
                  {deliveryCheckLoading
                    ? "Checking delivery to your pin…"
                    : deliveryFee != null
                      ? `Delivering to your pin${distanceKm != null ? `, ${distanceKm.toFixed(1)} km away` : ""}. Delivery fee Rs ${deliveryFee}.`
                      : "Pin selected."}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (ORDER SUMMARY + COUPON) */}
          <div
            className={`w-full min-w-0 transition-[width] duration-500 ease-in-out motion-reduce:transition-none ${
              isPickup ? "lg:w-[calc((100%-2rem)*2/3)]" : ""
            }`}
          >
            <div className="sticky top-24 space-y-4">
              <div className="space-y-4 rounded-2xl border border-[#E8E7E2] bg-white p-5">
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
                        <AllergenNote text={item.allergenInfo} />
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

                  {coupon && <DiscountRow code={coupon.code} amount={discount} />}

                  {orderType === "DELIVERY" && (
                    <div className="flex justify-between text-neutral-500">
                      <span>
                        {t("deliveryFee")}
                        {distanceKm != null && (
                          <span className="text-neutral-400"> ({distanceKm.toFixed(1)} km)</span>
                        )}
                      </span>
                      <span className="font-mono">
                        {deliveryCheckLoading ? "…" : feeUnavailable ? "—" : `Rs ${effectiveDeliveryFee}`}
                      </span>
                    </div>
                  )}

                  {orderType === "DELIVERY" && feeUnavailable && (
                    <div role="alert" className="flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      <span>We couldn&apos;t work out the delivery fee. Please retry, or choose pickup.</span>
                      <button
                        type="button"
                        onClick={() => deliveryQuery.refetch()}
                        className="shrink-0 rounded-lg border border-red-300 px-2.5 py-1 hover:bg-red-100"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-[#E8E7E2] pt-2 font-semibold text-[#17181C]">
                    <span>{t("total")}</span>
                    <span className="font-mono text-lg">Rs {total}</span>
                  </div>
                </div>

                {error && !payOpen && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={mutation.isPending || !!blockedReason}
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
                {blockedReason && <p className="text-center text-xs text-neutral-500">{blockedReason}</p>}
              </div>

              <div className="rounded-2xl border border-[#E8E7E2] bg-white p-5">
                <h2 className="mb-3 font-semibold text-[#17181C]">{t("couponCode")}</h2>
                <CouponBox />
              </div>
            </div>
          </div>
        </div>
      </form>

      {payOpen && (
        <PaymentModal
          total={total}
          pending={mutation.isPending}
          error={error}
          enabledMethods={enabledMethods} // <-- ADDED: Passes the filtered payment methods to the modal
          onSelect={(method) => {
            setError("");
            mutation.mutate(method);
          }}
          onClose={() => {
            setError("");
            setPayOpen(false);
          }}
        />
      )}
    </div>
  );
}