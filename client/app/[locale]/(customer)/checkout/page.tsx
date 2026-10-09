// app/[locale]/(customer)/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { checkout, validateCoupon } from "@/lib/api/orders";
import { AddressPicker } from "@/components/map/address-picker";
import { PaymentModal, type PaymentMethod } from "@/components/checkout/payment-modal";
import { checkDeliveryAvailability } from "@/lib/api/discovery";
import { AlertCircle, CheckCircle2, Loader2, ShoppingBag, Tag, X } from "lucide-react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { getErrorMessage } from "@/lib/utils/error";
import { useRedirectToLogin } from "@/hooks/use-require-login";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const isLoggedIn = useRedirectToLogin();

  const { items, restaurantId: storedRestaurantId, subtotal, clear } = useCartStore();
  const restaurantId =
    storedRestaurantId || items.find((i) => i.restaurantId)?.restaurantId || null;

  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  const sub = subtotal();

  const hasLocation = orderType === "DELIVERY" && !!restaurantId && deliveryLatitude != null && deliveryLongitude != null;
  const deliveryQuery = useQuery({
    queryKey: ["delivery-check", restaurantId, deliveryLatitude, deliveryLongitude],
    queryFn: () => checkDeliveryAvailability(restaurantId as string, deliveryLatitude as number, deliveryLongitude as number),
    enabled: hasLocation,
    retry: false,
  });
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
  const discount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, sub) : 0;
  const total = Math.max(0, sub - discount) + (orderType === "DELIVERY" ? effectiveDeliveryFee : 0);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    setCouponError("");
    if (!code) {
      setCouponError("Please enter a coupon code first.");
      return;
    }
    if (!restaurantId) {
      setCouponError("This cart has no restaurant attached. Clear the cart and add your items again.");
      return;
    }
    setCouponLoading(true);
    try {
      setAppliedCoupon(await validateCoupon(restaurantId, code.toUpperCase(), sub));
    } catch (err) {
      setAppliedCoupon(null);
      const response = isAxiosError(err) ? err.response : undefined;
      setCouponError(
        response?.status === 401
          ? "Please log in to apply a coupon."
          : !response
            ? "Could not reach the server. Check your connection."
            : getErrorMessage(err, "This coupon could not be applied.")
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const appliedCode = appliedCoupon?.code;
  useEffect(() => {
    if (!appliedCode || !restaurantId) return;
    let cancelled = false;
    validateCoupon(restaurantId, appliedCode, sub)
      .then((preview) => {
        if (!cancelled) setAppliedCoupon(preview);
      })
      .catch(() => {
        if (cancelled) return;
        setAppliedCoupon(null);
        setError("Your coupon is no longer valid for this cart.");
      });
    return () => {
      cancelled = true;
    };
  }, [sub, appliedCode, restaurantId]);

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
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
        
        //  Optional order-level delivery instructions 
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

              <>
                {/* Merged UX: Show not deliverable warning AND coordinate confirmation */}
                {notDeliverable && (
                  <p className="text-xs text-red-600 mt-3">
                    This restaurant doesn&apos;t deliver to your current location.
                  </p>
                )}
                {!notDeliverable && deliveryLatitude != null && deliveryLongitude != null && (
                  <p className="text-xs text-amber-600 mt-3">
                    {`Delivery pin selected: Lat ${deliveryLatitude.toFixed(4)}, Lng ${deliveryLongitude.toFixed(4)}`}
                  </p>
                )}
              </>
            </div>
          )}

          {/* COUPON */}
          <div className="rounded-2xl border border-[#E8E7E2] bg-white p-6">
            <h2 className="mb-4 font-semibold text-[#17181C]">{t("couponCode")}</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  aria-label={t("placeholders.coupon")}
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                  placeholder={t("placeholders.coupon")}
                  className="w-full rounded-xl border border-[#E8E7E2] py-2.5 pl-10 pr-4 text-sm uppercase outline-none focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/40"
                />
              </div>
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="flex items-center gap-1.5 rounded-xl border border-brand-line px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-red-600"
                >
                  <X size={14} /> Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  className="rounded-xl bg-brand-ink px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-ink-hover disabled:opacity-50"
                >
                  {couponLoading ? "…" : t("apply")}
                </button>
              )}
            </div>
            {couponError && (
              <div role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                {couponError}
              </div>
            )}
            {appliedCoupon && (
              <div role="status" className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-700">
                <CheckCircle2 size={16} className="shrink-0" />
                {`Coupon ${appliedCoupon.code} applied. You save Rs ${appliedCoupon.discountAmount}!`}
              </div>
            )}
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

              {appliedCoupon && (
                <div className="flex justify-between text-brand-success">
                  <span>{`Discount (${appliedCoupon.code})`}</span>
                  <span className="font-mono">- Rs {discount}</span>
                </div>
              )}

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
              disabled={
                mutation.isPending ||
                (orderType === "DELIVERY" && (!deliveryAddress.trim() || notDeliverable || deliveryCheckLoading || feeUnavailable))
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

      {payOpen && (
        <PaymentModal
          total={total}
          pending={mutation.isPending}
          error={error}
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